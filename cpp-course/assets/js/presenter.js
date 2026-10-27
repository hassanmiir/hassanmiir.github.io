/* ============================================================
   presenter.js — "follow the presenter" live sync for lectures.

   Two roles, decided by the URL:
     • PRESENTER:  .../lectureN/?present=<lecture-password>
         - full control of the deck
         - broadcasts the current slide number as you move
     • STUDENT (default, no ?present):
         - screen follows the presenter's slide automatically
         - cannot navigate forward on their own (locked)
         - if sync is unreachable, freezes on the current slide

   Transport: the free, no-signup Abacus counter service
   (CORS-enabled). The presenter CREATES a counter once (the
   service returns an admin key, kept in the presenter's browser)
   and SETs the slide number on every change. Students only GET
   the value — no key needed.

   Notes:
   - The admin key only lets someone move the class's slide pointer;
     it is never placed in the student page.
   - ~2s polling: students follow within a couple of seconds.
   ============================================================ */
(function () {
  var BASE = "https://abacus.jasoncameron.dev";
  var NS = "hassanmiir-cpp-sync";

  function lectureId() {
    // Prefer an explicit <body data-lecture="..."> (lets non-"lectureN" folders
    // like /drahsan/ have their own sync namespace); fall back to the URL.
    var attr = document.body && document.body.getAttribute("data-lecture");
    if (attr) return attr;
    return (location.pathname.match(/\/(lecture\d+)\/?/) || [])[1] || "lecture";
  }
  function qs(name) {
    var m = new RegExp("[?&]" + name + "=([^&]*)").exec(location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  var lec = lectureId();
  var KEY = lec + "-slide";                 // counter key for this lecture
  var presentPw = qs("present");            // presenter mode if set

  // ---- shared helpers ----
  function getVal() {
    return fetch(BASE + "/get/" + NS + "/" + KEY, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (d) { return d.value; });
  }

  function waitForReveal(cb) {
    if (window.Reveal && Reveal.isReady && Reveal.isReady()) return cb();
    if (window.Reveal && Reveal.on) { Reveal.on("ready", cb); return; }
    setTimeout(function () { waitForReveal(cb); }, 150);
  }

  // =========================================================
  //  PRESENTER
  // =========================================================
  function runPresenter() {
    var LSK = "cpp_present_adminkey_" + lec;
    var adminKey = null;
    try { adminKey = localStorage.getItem(LSK); } catch (e) {}
    var forceFresh = qs("fresh") === "1";

    function setSlide(n) {
      if (!adminKey) return;
      fetch(BASE + "/set/" + NS + "/" + KEY + "?value=" + n, {
        method: "POST",
        headers: { "Authorization": "Bearer " + adminKey }
      }).catch(function () {});
    }

    function ensureCounter() {
      // Create the counter (first ever use). If it already exists and we
      // have no key, make a fresh per-session key so we can drive it.
      var createUrl = BASE + "/create/" + NS + "/" + KEY + "?initializer=0";
      fetch(createUrl).then(function (r) { return r.json().then(function (d) { return { s: r.status, d: d }; }); })
        .then(function (res) {
          if (res.s === 201 && res.d.admin_key) {
            adminKey = res.d.admin_key;
            try { localStorage.setItem(LSK, adminKey); } catch (e) {}
          }
          // if 409 (exists) we rely on the stored adminKey (if any)
          startBroadcast();
        })
        .catch(function () { startBroadcast(); });
    }

    function startBroadcast() {
      waitForReveal(function () {
        badge("● Presenting — students are following you", "live");
        // Broadcast slide index + 1, so the value is always >= 1 while a
        // presenter is live (0 is reserved for "no presenter"). Students
        // subtract 1. This lets the first slide (index 0) still lock students.
        setSlide(Reveal.getState().indexh + 1);
        Reveal.on("slidechanged", function (e) { setSlide(e.indexh + 1); });
        // also re-push every 5s so late-joining students catch up
        setInterval(function () { setSlide(Reveal.getState().indexh + 1); }, 5000);
      });
    }

    if (forceFresh) { adminKey = null; try { localStorage.removeItem(LSK); } catch (e) {} }
    if (adminKey) startBroadcast(); else ensureCounter();
  }

  // =========================================================
  //  STUDENT (follow + lock)
  // =========================================================
  function runStudent() {
    waitForReveal(function () {
      var lastKnown = 0;
      var locked = false;       // only lock ONCE a live presenter is seen
      var lastSeen = 0;         // last slide index the presenter broadcast
      var missedPolls = 0;      // consecutive polls with no live presenter

      // Reveal all fragments on the current slide (students can't advance them).
      function showAllFragments() {
        try { var g = 0; while (g++ < 60 && Reveal.nextFragment()) {} } catch (e) {}
      }

      // Engage the follow-lock the first time we detect a live presenter.
      function engageLock() {
        if (locked) return;
        locked = true;
        Reveal.configure({ keyboard: false, touch: false, controls: false });
      }
      // Release the lock if the presenter goes away for a while, so the deck
      // is viewable again (never leaves a student stuck on a frozen screen).
      function releaseLock() {
        if (!locked) return;
        locked = false;
        Reveal.configure({ keyboard: true, touch: true, controls: true });
      }

      // Block forward keys only while locked; always let text input through
      // (e.g. the password gate) and always allow looking back.
      document.addEventListener("keydown", function (e) {
        if (!locked) return;
        var t = e.target;
        var typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
        var gateUp = !!document.querySelector(".gate-overlay");
        if (typing || gateUp) return;
        var review = (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "PageUp");
        if (!review) { e.stopPropagation(); e.preventDefault(); }
      }, true);

      // While locked, a student may not move PAST the presenter's slide.
      Reveal.on("slidechanged", function (e) {
        if (locked && e.indexh > lastKnown) { Reveal.slide(lastKnown); }
      });

      badge("🔓 Open — browse freely", "ok");

      function poll() {
        getVal().then(function (v) {
          // A live presenter is "present" when the broadcast slide is > 0,
          // OR it stays at a steady value we can follow. Treat 0 as "no
          // presenter yet" so an idle counter never traps the student on slide 1.
          if (typeof v === "number" && v > 0) {
            // presenter is live (value is slide index + 1) → follow + lock
            var target = v - 1;
            missedPolls = 0; lastSeen = v; lastKnown = target;
            engageLock();
            badge("🟢 Following the presenter", "ok");
            if (Reveal.getState().indexh !== target) {
              Reveal.slide(target);
              setTimeout(showAllFragments, 60);
            } else {
              showAllFragments();
            }
          } else {
            // v === 0 (or none) → no live presenter
            if (locked) {
              // presenter paused on the first slide or stopped; after a few
              // quiet polls, let students browse rather than sit frozen.
              missedPolls++;
              if (missedPolls >= 6) { releaseLock(); badge("🔓 Open — browse freely", "ok"); }
            } else {
              badge("🔓 Open — browse freely", "ok");
            }
          }
        }).catch(function () {
          // network error: if we were following, say reconnecting but don't
          // trap them forever; if we never locked, just stay freely browsable.
          if (locked) {
            missedPolls++;
            badge("⚠ Reconnecting…", "wait");
            if (missedPolls >= 8) { releaseLock(); badge("🔓 Open — browse freely", "ok"); }
          } else {
            badge("🔓 Open — browse freely", "ok");
          }
        });
      }
      poll();
      setInterval(poll, 2000);
    });
  }

  // =========================================================
  //  small status badge
  // =========================================================
  function badge(text, cls) {
    var el = document.getElementById("sync-badge");
    if (!el) {
      el = document.createElement("div");
      el.id = "sync-badge";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.className = "sync-badge " + (cls || "");
  }

  // boot
  if (presentPw) runPresenter(); else runStudent();
})();
