/* Simple, privacy-light analytics used on all pages.
   - Global page view counter (countapi.xyz)
   - Country detection (ipapi.co) to aggregate views by country
   - Top-country list + Leaflet map markers
   No cookies. Graceful fallbacks.
*/
(function(){
  const NAMESPACE = "mir-hassan-site";
  const TOTAL_KEY = "total-views";

  const VIEWS_EL = document.getElementById("mh-views");
  const YOU_EL   = document.getElementById("mh-you");
  const LIST_EL  = document.getElementById("mh-countries");
  const MAP_EL   = document.getElementById("map");

  const KNOWN = [
    ["FI","Finland"],["SE","Sweden"],["NO","Norway"],["DK","Denmark"],["IS","Iceland"],
    ["DE","Germany"],["NL","Netherlands"],["BE","Belgium"],["FR","France"],["IT","Italy"],
    ["ES","Spain"],["PT","Portugal"],["AT","Austria"],["CH","Switzerland"],["IE","Ireland"],
    ["PL","Poland"],["CZ","Czechia"],["SK","Slovakia"],["SI","Slovenia"],["HU","Hungary"],
    ["EE","Estonia"],["LV","Latvia"],["LT","Lithuania"],["GR","Greece"],
    ["GB","United Kingdom"],["TR","Türkiye"],
    ["US","United States"],["CA","Canada"],["AU","Australia"],["NZ","New Zealand"],
    ["IN","India"],["PK","Pakistan"],["AE","United Arab Emirates"]
  ];
  const NAME_BY = Object.fromEntries(KNOWN);
  const CENTROIDS = {
    FI:[64.5,26.0], SE:[62.0,15.0], NO:[64.5,12.0], DK:[56.0,10.0], IS:[64.9,-18.6],
    DE:[51.2,10.4], NL:[52.1,5.3], BE:[50.8,4.5], FR:[46.2,2.2], IT:[42.8,12.5],
    ES:[40.2,-3.7], PT:[39.6,-8.0], AT:[47.6,14.1], CH:[46.8,8.2], IE:[53.4,-8.0],
    PL:[52.1,19.1], CZ:[49.8,15.5], SK:[48.7,19.7], SI:[46.1,14.8], HU:[47.2,19.5],
    EE:[58.7,25.0], LV:[56.9,24.9], LT:[55.2,23.9], GR:[39.1,22.9],
    GB:[54.2,-2.9], TR:[39.0,35.0], US:[39.8,-98.6], CA:[56.1,-106.3], AU:[-25.3,133.8], NZ:[-41.5,172.5], IN:[21.1,78.0], PK:[29.4,69.3], AE:[24.2,54.4], UN:[20,0]
  };

  function flag(cc){ if(!cc||cc.length!==2) return "🌐"; const base=127397; cc=cc.toUpperCase(); return String.fromCodePoint(cc.charCodeAt(0)+base, cc.charCodeAt(1)+base); }

  async function getCountry(){
    try{ const r=await fetch("https://ipapi.co/json/",{cache:"no-store"}); if(r.ok){ const j=await r.json(); if(j && j.country && j.country_name){ return {code:j.country.toUpperCase(), name:j.country_name}; } } }catch(e){}
    // Fallback to browser locale
    try{ const lang=(navigator.languages&&navigator.languages[0])||navigator.language||""; const m=lang.match(/-([A-Z]{2})$/i); if(m){ const code=m[1].toUpperCase(); return {code, name: NAME_BY[code]||code}; } }catch(e){}
    return {code:"UN", name:"Unknown"};
  }

  async function bump(key){ try{ const r=await fetch(`https://api.countapi.xyz/hit/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(key)}`); if(r.ok) return r.json(); }catch(e){} return null; }
  async function get(key){ try{ const r=await fetch(`https://api.countapi.xyz/get/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(key)}`); if(r.ok) return r.json(); }catch(e){} return null; }

  function renderTop(list){
    if(!LIST_EL) return; LIST_EL.innerHTML="";
    list.slice(0,8).forEach(item=>{
      const row=document.createElement("div");
      row.style.display="grid"; row.style.gridTemplateColumns="26px 1fr 60px"; row.style.alignItems="center"; row.style.gap="8px";
      const f=document.createElement("div"); f.textContent=flag(item.code);
      const n=document.createElement("div"); n.textContent=NAME_BY[item.code]||item.code;
      const c=document.createElement("div"); c.style.textAlign="right"; c.textContent=item.count;
      const bar=document.createElement("div"); bar.style.gridColumn="1 / span 3"; bar.style.height="10px"; bar.style.border="1px solid rgba(15,23,42,.08)"; bar.style.borderRadius="999px"; bar.style.background="rgba(15,23,42,.06)";
      const fill=document.createElement("div"); fill.style.height="100%"; fill.style.borderRadius="999px"; fill.style.background="linear-gradient(90deg, var(--brand-1,#0e9ae6), var(--brand-2,#6366f1))"; fill.style.width=item.percent+"%";
      bar.appendChild(fill);
      row.appendChild(f); row.appendChild(n); row.appendChild(c); row.appendChild(bar);
      LIST_EL.appendChild(row);
    });
  }

  function renderMap(list){
    if(!MAP_EL || typeof L === 'undefined') return;
    const map = L.map(MAP_EL).setView([30,10], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 6, attribution: '© OpenStreetMap'}).addTo(map);
    const max = Math.max(1, ...list.map(x=>x.count));
    list.forEach(({code,count})=>{
      const c = CENTROIDS[code] || CENTROIDS.UN;
      const radius = 6 + (count/max)*18;
      const circle = L.circleMarker(c, {radius, color:'#3b82f6', fillColor:'#6366f1', fillOpacity:0.6, weight:1});
      circle.bindPopup(`${flag(code)} ${(NAME_BY[code]||code)}: <strong>${count}</strong>`);
      circle.addTo(map);
    });
  }

  async function refresh(){
    const you = await getCountry();
    if(YOU_EL) YOU_EL.textContent = `${flag(you.code)} ${you.name}`;

    const total = await bump(TOTAL_KEY);
    if(VIEWS_EL) VIEWS_EL.textContent = total && total.value ? total.value : "—";
    await bump(`country-${you.code}`);

    const results=[]; let max=1;
    for(const [code] of KNOWN){
      const res = await get(`country-${code}`);
      const count = res && res.value ? res.value : 0;
      results.push({code, count}); if(count>max) max=count;
    }
    const un = await get('country-UN');
    results.push({code:'UN', count: (un && un.value) ? un.value : 0});

    const sorted = results.sort((a,b)=>b.count-a.count);
    const top = sorted.slice(0,8).map(x=>({...x, percent: max? Math.round((x.count/max)*100):0 }));
    renderTop(top);
    renderMap(sorted.filter(x=>x.count>0).slice(0,20));
  }

  refresh();
})();
