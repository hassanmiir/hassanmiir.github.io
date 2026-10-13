/* ============================================================
   explain.js — click-to-reveal explanation bubbles.

   Mark any word with:
     <span class="xp" data-tip="One letter of text, like 'A'.">char</span>

   Behaviour:
   - The word gets a subtle dotted underline (looks tappable).
   - Click it  → a small bubble with the explanation appears beside it.
   - Click again (or click the word / press Esc) → it hides.
   - Only one bubble open at a time.

   Presenter sync: if this page is the PRESENTER (?present=...),
   clicks are broadcast so every student's screen opens the same
   bubble within ~1–2s. Students' own clicks are local (and the
   presenter's next click re-syncs everyone). Uses the same free
   Abacus key space as the slide sync.
   ============================================================ */
(function () {
  var BASE = "https://abacus.jasoncameron.dev";
  var NS = "hassanmiir-cpp-sync";
  function lectureId(){ return (location.pathname.match(/\/(lecture\d+)\/?/)||[])[1]||"lecture"; }
  function qs(n){ var m=new RegExp("[?&]"+n+"=([^&]*)").exec(location.search); return m?decodeURIComponent(m[1]):null; }

  var lec = lectureId();
  var isPresenter = !!qs("present");
  var BKEY = lec + "-bubble";               // which bubble index is open
  var BLSK = "cpp_present_bubblekey_" + lec; // this counter's own admin key
  function getBubbleKey(){ try { return localStorage.getItem(BLSK); } catch(e){ return null; } }

  var current = null;   // currently open .xp element
  var allXp = [];       // indexed list for sync

  function closeBubble() {
    var b = document.getElementById("xp-bubble");
    if (b) b.remove();
    if (current) current.classList.remove("xp-active");
    current = null;
  }

  function openBubble(el) {
    closeBubble();
    var tip = el.getAttribute("data-tip") || "";
    if (!tip) return;
    current = el; el.classList.add("xp-active");
    var b = document.createElement("div");
    b.id = "xp-bubble"; b.className = "xp-bubble";
    b.innerHTML = '<span class="xp-arrow"></span>' + tip;
    document.body.appendChild(b);
    // position above the word, centred; flip below if near the top
    var r = el.getBoundingClientRect();
    var bw = Math.min(360, window.innerWidth - 24);
    b.style.maxWidth = bw + "px";
    var bb = b.getBoundingClientRect();
    var left = r.left + r.width/2 - bb.width/2;
    left = Math.max(12, Math.min(left, window.innerWidth - bb.width - 12));
    var top = r.top - bb.height - 12;
    var below = false;
    if (top < 8) { top = r.bottom + 12; below = true; }
    b.style.left = left + "px";
    b.style.top = top + "px";
    b.classList.toggle("below", below);
    // point the arrow at the word
    var arrow = b.querySelector(".xp-arrow");
    var ax = r.left + r.width/2 - left;
    arrow.style.left = Math.max(14, Math.min(ax, bb.width - 14)) + "px";
    requestAnimationFrame(function(){ b.classList.add("show"); });
  }

  function toggle(el) {
    if (current === el) closeBubble(); else openBubble(el);
  }

  // ---- presenter broadcast ----
  var bubbleKeyReady = false;
  function ensureBubbleKey(cb) {
    if (getBubbleKey()) { bubbleKeyReady = true; return cb(); }
    if (bubbleKeyReady) return cb();
    // Create this bubble counter once and keep ITS OWN admin key.
    fetch(BASE + "/create/" + NS + "/" + BKEY + "?initializer=0")
      .then(function(r){ return r.json().then(function(d){ return {s:r.status,d:d}; }); })
      .then(function(res){
        if (res.s === 201 && res.d.admin_key) {
          try { localStorage.setItem(BLSK, res.d.admin_key); } catch(e){}
        }
        bubbleKeyReady = true; cb();
      })
      .catch(function(){ bubbleKeyReady = true; cb(); });
  }
  function broadcast(idx) {
    if (!isPresenter) return;
    ensureBubbleKey(function () {
      var k = getBubbleKey();
      if (!k) return;
      fetch(BASE + "/set/" + NS + "/" + BKEY + "?value=" + idx, {
        method: "POST", headers: { "Authorization": "Bearer " + k }
      }).catch(function(){});
    });
  }
  // encode: value = (slideIndex+1)*1000 + (xpIndexOnSlide+1); 0 = none
  function encode(el) {
    var slide = el.closest("section");
    var sidx = [].indexOf.call(document.querySelectorAll(".slides > section"), slide);
    var list = [].slice.call(slide.querySelectorAll(".xp"));
    var xidx = list.indexOf(el);
    if (sidx < 0 || xidx < 0) return 0;
    return (sidx + 1) * 1000 + (xidx + 1);
  }
  function decodeAndOpen(code) {
    if (!code) { closeBubble(); return; }
    var sidx = Math.floor(code / 1000) - 1;
    var xidx = (code % 1000) - 1;
    var slide = document.querySelectorAll(".slides > section")[sidx];
    if (!slide) return;
    var el = slide.querySelectorAll(".xp")[xidx];
    if (el && el !== current) openBubble(el);
    if (!el) closeBubble();
  }

  function bind() {
    document.querySelectorAll(".xp:not([data-xp-bound])").forEach(function (el) {
      el.setAttribute("data-xp-bound", "1");
      el.addEventListener("click", function (e) {
        e.stopPropagation();
        toggle(el);
        if (isPresenter) broadcast(current ? encode(el) : 0);
      });
    });
  }

  // click elsewhere / Esc closes
  document.addEventListener("click", function (e) {
    if (current && !e.target.closest(".xp") && !e.target.closest(".xp-bubble")) {
      closeBubble();
      if (isPresenter) broadcast(0);
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && current) { closeBubble(); if (isPresenter) broadcast(0); }
  });
  // reposition / close when the slide changes
  if (window.Reveal && Reveal.on) Reveal.on("slidechanged", function(){ closeBubble(); if(isPresenter) broadcast(0); });

  // ---- student: poll for presenter's open bubble ----
  function studentPoll() {
    fetch(BASE + "/get/" + NS + "/" + BKEY, { cache: "no-store" })
      .then(function(r){ if(!r.ok) throw 0; return r.json(); })
      .then(function(d){ decodeAndOpen(d.value || 0); })
      .catch(function(){});
  }

  function init() {
    bind();
    if (!isPresenter) { studentPoll(); setInterval(studentPoll, 2000); }
  }
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);
  if (window.Reveal && Reveal.on) Reveal.on("ready", init);
  window.ExplainInit = init;
})();
