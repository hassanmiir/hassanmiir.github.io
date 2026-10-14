/* ============================================================
   gate.js — simple per-lecture password gate.
   Shows a full-screen overlay until the student types the
   shared password (set in course.json -> access.password).
   Remembers success in sessionStorage so a refresh won't
   re-prompt. This is a "don't open early" deterrent, not
   strong security: a static site cannot truly hide a secret.
   ============================================================ */
// This script may run from <head>, where document.body is not yet available.
// Pages that declare id/password on <body> (standalone decks like /drahsan/)
// therefore need us to wait for the body before reading those attributes.
function cppGateStart() {
  function clearPending() {
    document.documentElement.classList.remove("gate-pending");
  }
  var cfg = (window.COURSE && window.COURSE.access) || null;
  // If no config or gate disabled, do nothing (and reveal the deck).
  if (!cfg || cfg.enabled === false) { clearPending(); return; }

  // Which lecture is this page? Read <body data-lecture="lectureN"> or infer
  // from the URL (…/lectureN/).
  var lectureId = (document.body && document.body.getAttribute("data-lecture")) || "";
  if (!lectureId) {
    var m = location.pathname.match(/\/(lecture\d+)\/?/);
    if (m) lectureId = m[1];
  }

  // Per-lecture password: each lecture carries its own 'password' in course.json.
  // No dates — the password is always required. You tell students the password
  // in class. (A lecture with no password set is left open.)
  var lec = null;
  try { lec = (window.COURSE.lectures || []).filter(function (l) { return l.id === lectureId; })[0]; } catch (e) {}
  // A page can also set its own password directly via <body data-gate-password="...">
  // (used by standalone decks like /drahsan/ that aren't in the course lecture list).
  var ownPass = document.body && document.body.getAttribute("data-gate-password");
  var PASS = (lec && lec.password) ? String(lec.password) : (ownPass ? String(ownPass) : "");
  if (!PASS) { clearPending(); return; }   // no password defined → open

  // Forgiving compare: ignore case and surrounding spaces, so "cpp-l2",
  // "CPP-L2 " and "cpp-L2" all work. (The capital L and phone autocapitalise
  // trip people up otherwise.)
  function norm(s) { return String(s == null ? "" : s).trim().toLowerCase(); }
  function matches(val) { return norm(val) === norm(PASS); }

  // Remember unlock per-lecture, so unlocking one doesn't unlock the next.
  var KEY = "cpp_gate_ok_" + lectureId;

  // Already unlocked this lecture this session? skip.
  try { if (sessionStorage.getItem(KEY) === "1") { clearPending(); return; } } catch (e) {}

  // PRESENTER shortcut: if the URL carries ?present=<the correct password>,
  // the instructor has already supplied it — unlock straight through, no retyping.
  // (Only unlocks when the password actually matches, so it's no weaker than typing it.)
  try {
    var pm = /[?&]present=([^&]*)/.exec(location.search);
    if (pm && matches(decodeURIComponent(pm[1]))) {
      try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
      clearPending();
      return;
    }
  } catch (e) {}

  function buildOverlay() {
    var o = document.createElement("div");
    o.className = "gate-overlay";
    o.innerHTML =
      '<div class="gate-card">' +
        '<div class="gate-lock">🔒</div>' +
        '<h2>Today’s lecture is locked</h2>' +
        '<p>Enter the password your instructor gave you in class.</p>' +
        '<form class="gate-form" autocomplete="off">' +
          '<input type="password" class="gate-input" placeholder="Password" ' +
                 'autocapitalize="off" autocorrect="off" spellcheck="false" aria-label="Lecture password">' +
          '<button type="submit" class="gate-btn">Unlock</button>' +
        '</form>' +
        '<div class="gate-msg" role="alert"></div>' +
      '</div>';
    return o;
  }

  function mount() {
    var o = buildOverlay();
    document.body.appendChild(o);
    document.documentElement.classList.add("gate-active");

    var input = o.querySelector(".gate-input");
    var form = o.querySelector(".gate-form");
    var msg = o.querySelector(".gate-msg");
    var tries = 0;
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 60);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var val = (input.value || "").trim();
      if (matches(val)) {
        try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
        o.classList.add("gate-ok");
        document.documentElement.classList.remove("gate-active");
        clearPending();
        setTimeout(function () { o.remove(); }, 420);
      } else {
        tries++;
        msg.textContent = tries >= 3
          ? "Still not right — ask your instructor for today’s password."
          : "That password isn’t right. Try again.";
        o.querySelector(".gate-card").classList.remove("shake");
        void o.querySelector(".gate-card").offsetWidth; // reflow to restart animation
        o.querySelector(".gate-card").classList.add("shake");
        input.select();
      }
    });
  }

  if (document.readyState !== "loading") mount();
  else document.addEventListener("DOMContentLoaded", mount);
}

// Run as soon as <body> is available. If this script is in <head>, document.body
// is still null, so defer to DOMContentLoaded; the pre-hide CSS keeps the deck
// covered until then, so there is no early flash of content.
(function () {
  if (document.body) { cppGateStart(); }
  else { document.addEventListener("DOMContentLoaded", cppGateStart); }
})();
