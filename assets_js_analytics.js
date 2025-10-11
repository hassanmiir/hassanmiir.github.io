/* Simple, privacy-light analytics used on all pages.
   - Global page view counter (countapi.xyz)
   - Country detection (ipapi.co) to aggregate views by country
   - Top-country list + Leaflet map markers
   No cookies. Graceful fallbacks.
*/
(function() {
  'use strict';
  
  // Configuration
  const NAMESPACE = "mir-hassan-site";
  const TOTAL_KEY = "total-views";
  const REQUEST_TIMEOUT = 5000; // 5 seconds timeout for API calls

  // DOM Elements
  const VIEWS_EL = document.getElementById("mh-views");
  const YOU_EL = document.getElementById("mh-you");
  const LIST_EL = document.getElementById("mh-countries");
  const MAP_EL = document.getElementById("map");

  // Known countries and their names
  const KNOWN = [
    ["FI", "Finland"], ["SE", "Sweden"], ["NO", "Norway"], ["DK", "Denmark"], ["IS", "Iceland"],
    ["DE", "Germany"], ["NL", "Netherlands"], ["BE", "Belgium"], ["FR", "France"], ["IT", "Italy"],
    ["ES", "Spain"], ["PT", "Portugal"], ["AT", "Austria"], ["CH", "Switzerland"], ["IE", "Ireland"],
    ["PL", "Poland"], ["CZ", "Czechia"], ["SK", "Slovakia"], ["SI", "Slovenia"], ["HU", "Hungary"],
    ["EE", "Estonia"], ["LV", "Latvia"], ["LT", "Lithuania"], ["GR", "Greece"],
    ["GB", "United Kingdom"], ["TR", "Türkiye"],
    ["US", "United States"], ["CA", "Canada"], ["AU", "Australia"], ["NZ", "New Zealand"],
    ["IN", "India"], ["PK", "Pakistan"], ["AE", "United Arab Emirates"], ["SA", "Saudi Arabia"],
    ["JP", "Japan"], ["KR", "South Korea"], ["CN", "China"], ["BR", "Brazil"], ["MX", "Mexico"],
    ["AR", "Argentina"], ["ZA", "South Africa"], ["EG", "Egypt"], ["NG", "Nigeria"]
  ];

  const NAME_BY = Object.fromEntries(KNOWN);

  // Geographic centroids for map markers [latitude, longitude]
  const CENTROIDS = {
    FI: [64.5, 26.0], SE: [62.0, 15.0], NO: [64.5, 12.0], DK: [56.0, 10.0], IS: [64.9, -18.6],
    DE: [51.2, 10.4], NL: [52.1, 5.3], BE: [50.8, 4.5], FR: [46.2, 2.2], IT: [42.8, 12.5],
    ES: [40.2, -3.7], PT: [39.6, -8.0], AT: [47.6, 14.1], CH: [46.8, 8.2], IE: [53.4, -8.0],
    PL: [52.1, 19.1], CZ: [49.8, 15.5], SK: [48.7, 19.7], SI: [46.1, 14.8], HU: [47.2, 19.5],
    EE: [58.7, 25.0], LV: [56.9, 24.9], LT: [55.2, 23.9], GR: [39.1, 22.9],
    GB: [54.2, -2.9], TR: [39.0, 35.0], US: [39.8, -98.6], CA: [56.1, -106.3], 
    AU: [-25.3, 133.8], NZ: [-41.5, 172.5], IN: [21.1, 78.0], PK: [29.4, 69.3], 
    AE: [24.2, 54.4], SA: [24.0, 45.0], JP: [36.2, 138.2], KR: [36.5, 127.8], 
    CN: [35.0, 105.0], BR: [-10.0, -55.0], MX: [23.6, -102.5], AR: [-34.0, -64.0],
    ZA: [-29.0, 24.0], EG: [26.8, 30.8], NG: [9.1, 8.7], UN: [20, 0]
  };

  /**
   * Convert country code to flag emoji
   */
  function flag(cc) {
    if (!cc || cc.length !== 2) return "🌐";
    const base = 127397;
    cc = cc.toUpperCase();
    return String.fromCodePoint(
      cc.charCodeAt(0) + base,
      cc.charCodeAt(1) + base
    );
  }

  /**
   * Fetch with timeout wrapper
   */
  function fetchWithTimeout(url, options = {}) {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
      )
    ]);
  }

  /**
   * Get visitor's country using ipapi.co
   * Falls back to browser locale if API fails
   */
  async function getCountry() {
    // Try ipapi.co first
    try {
      const response = await fetchWithTimeout("https://ipapi.co/json/", {
        cache: "no-store"
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.country && data.country_name) {
          return {
            code: data.country.toUpperCase(),
            name: data.country_name
          };
        }
      }
    } catch (error) {
      console.warn('ipapi.co failed:', error.message);
    }

    // Fallback to browser locale
    try {
      const lang = (navigator.languages && navigator.languages[0]) || 
                   navigator.language || "";
      const match = lang.match(/-([A-Z]{2})$/i);
      
      if (match) {
        const code = match[1].toUpperCase();
        return {
          code: code,
          name: NAME_BY[code] || code
        };
      }
    } catch (error) {
      console.warn('Browser locale detection failed:', error.message);
    }

    // Ultimate fallback
    return { code: "UN", name: "Unknown" };
  }

  /**
   * Increment counter for a given key
   */
  async function bump(key) {
    try {
      const url = `https://api.countapi.xyz/hit/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(key)}`;
      const response = await fetchWithTimeout(url);
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Failed to bump counter for ${key}:`, error.message);
    }
    return null;
  }

  /**
   * Get counter value for a given key
   */
  async function get(key) {
    try {
      const url = `https://api.countapi.xyz/get/${encodeURIComponent(NAMESPACE)}/${encodeURIComponent(key)}`;
      const response = await fetchWithTimeout(url);
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn(`Failed to get counter for ${key}:`, error.message);
    }
    return null;
  }

  /**
   * Render top countries list with progress bars
   */
  function renderTop(list) {
    if (!LIST_EL) return;
    
    LIST_EL.innerHTML = "";
    
    list.slice(0, 8).forEach(item => {
      const row = document.createElement("div");
      row.style.display = "grid";
      row.style.gridTemplateColumns = "26px 1fr 60px";
      row.style.alignItems = "center";
      row.style.gap = "8px";

      // Flag
      const flagEl = document.createElement("div");
      flagEl.textContent = flag(item.code);

      // Country name
      const nameEl = document.createElement("div");
      nameEl.textContent = NAME_BY[item.code] || item.code;

      // Count
      const countEl = document.createElement("div");
      countEl.style.textAlign = "right";
      countEl.style.fontWeight = "600";
      countEl.textContent = item.count;

      // Progress bar container
      const bar = document.createElement("div");
      bar.style.gridColumn = "1 / span 3";
      bar.style.height = "10px";
      bar.style.border = "1px solid rgba(15,23,42,.08)";
      bar.style.borderRadius = "999px";
      bar.style.background = "rgba(15,23,42,.06)";

      // Progress bar fill
      const fill = document.createElement("div");
      fill.style.height = "100%";
      fill.style.borderRadius = "999px";
      fill.style.background = "linear-gradient(90deg, #0e9ae6, #6366f1)";
      fill.style.width = item.percent + "%";
      fill.style.transition = "width 0.3s ease";

      bar.appendChild(fill);
      row.appendChild(flagEl);
      row.appendChild(nameEl);
      row.appendChild(countEl);
      row.appendChild(bar);
      LIST_EL.appendChild(row);
    });
  }

  /**
   * Render interactive map with country markers
   */
  function renderMap(list) {
    if (!MAP_EL || typeof L === 'undefined') {
      console.warn('Map element or Leaflet library not found');
      return;
    }

    try {
      // Initialize map
      const map = L.map(MAP_EL, {
        scrollWheelZoom: false
      }).setView([30, 10], 2);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 6,
        minZoom: 2,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Find max count for sizing
      const max = Math.max(1, ...list.map(x => x.count));

      // Add markers for each country
      list.forEach(({ code, count }) => {
        const coords = CENTROIDS[code] || CENTROIDS.UN;
        const radius = 6 + (count / max) * 18;

        const circle = L.circleMarker(coords, {
          radius: radius,
          color: '#3b82f6',
          fillColor: '#6366f1',
          fillOpacity: 0.6,
          weight: 2
        });

        circle.bindPopup(
          `${flag(code)} <strong>${NAME_BY[code] || code}</strong><br>Views: ${count}`
        );

        circle.addTo(map);
      });
    } catch (error) {
      console.error('Failed to render map:', error);
    }
  }

  /**
   * Main function to refresh analytics data
   */
  async function refresh() {
    try {
      // Get visitor's country
      const you = await getCountry();
      if (YOU_EL) {
        YOU_EL.textContent = `${flag(you.code)} ${you.name}`;
      }

      // Bump total views counter
      const total = await bump(TOTAL_KEY);
      if (VIEWS_EL) {
        VIEWS_EL.textContent = total && total.value ? total.value.toLocaleString() : "—";
      }

      // Bump country-specific counter
      await bump(`country-${you.code}`);

      // Fetch all country counts
      const results = [];
      let maxCount = 1;

      // Fetch known countries
      for (const [code] of KNOWN) {
        const res = await get(`country-${code}`);
        const count = res && res.value ? res.value : 0;
        results.push({ code, count });
        if (count > maxCount) maxCount = count;
      }

      // Fetch unknown country count
      const unknownRes = await get('country-UN');
      results.push({
        code: 'UN',
        count: unknownRes && unknownRes.value ? unknownRes.value : 0
      });

      // Sort by count (descending)
      const sorted = results.sort((a, b) => b.count - a.count);

      // Prepare top countries with percentages
      const top = sorted
        .slice(0, 8)
        .map(x => ({
          ...x,
          percent: maxCount ? Math.round((x.count / maxCount) * 100) : 0
        }));

      // Render visualizations
      renderTop(top);
      renderMap(sorted.filter(x => x.count > 0).slice(0, 20));

    } catch (error) {
      console.error('Analytics refresh failed:', error);
    }
  }

  // Initialize analytics when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refresh);
  } else {
    refresh();
  }

})();