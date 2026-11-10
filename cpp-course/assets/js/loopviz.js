/* ============================================================
   loopviz.js — animated loop visualizer for the slides.

   Drop a <div class="loopviz-widget" data-kind="while|for|break|continue">
   into a slide. It renders:
     - the code with the current line highlighted,
     - a counter box showing the loop variable,
     - a condition box that flashes green (true) / red (false),
     - an output strip that fills as the loop prints,
     - an animated "loop back" / "break out" / "skip" arrow,
     - a bubble that explains each step in plain words.

   Controls: ▶ Play, ⏸ Pause, ⏭ Step, ↺ Reset.
   Auto-steps ~1.1s each on Play. Fully self-contained, no deps.
   Works in presenter follow-mode (students see the same frames when
   the presenter plays — presenter.js keeps their slide in sync; each
   viewer's widget animates locally and identically).
   ============================================================ */
(function () {
  "use strict";

  // Build the ordered list of "steps" for each kind of loop. Each step is
  // { line, vars, cond, action, out, note } where:
  //   line   = code line index to highlight (0-based)
  //   vars   = label to show in the counter box (e.g. "i = 3")
  //   cond   = "true" | "false" | null  (lights the condition box)
  //   action = "body" | "step" | "back" | "exit" | "break" | "skip" | "init" | null
  //   out    = string appended to the output strip (or null)
  //   note   = plain-words explanation for the bubble
  function buildSteps(kind) {
    var steps = [];
    if (kind === "while") {
      // int i = 1; while (i <= 3) { cout<<i; i=i+1; }
      var i = 1;
      steps.push({ line: 0, vars: "i = 1", cond: null, action: "init", out: null,
        note: "Start: we set i = 1 before the loop begins." });
      while (true) {
        var ok = i <= 3;
        steps.push({ line: 1, vars: "i = " + i, cond: ok ? "true" : "false", action: null, out: null,
          note: "Check the condition: is " + i + " ≤ 3? " + (ok ? "Yes — run the body." : "No — leave the loop.") });
        if (!ok) { steps.push({ line: 4, vars: "i = " + i, cond: null, action: "exit", out: null,
          note: "The condition is false, so the loop ends. Done." }); break; }
        steps.push({ line: 2, vars: "i = " + i, cond: null, action: "body", out: String(i),
          note: "Run the body: print " + i + "." });
        steps.push({ line: 3, vars: "i = " + (i + 1), cond: null, action: "step", out: null,
          note: "Step: i becomes " + (i + 1) + ". This is what ends the loop." });
        steps.push({ line: 1, vars: "i = " + (i + 1), cond: null, action: "back", out: null,
          note: "Loop back — go check the condition again." });
        i = i + 1;
      }
    } else if (kind === "for") {
      // for (int i = 1; i <= 4; i++) cout<<i;
      steps.push({ line: 0, vars: "i = 1", cond: null, action: "init", out: null,
        note: "Start (runs once): i = 1." });
      var j = 1;
      while (true) {
        var ok2 = j <= 4;
        steps.push({ line: 0, vars: "i = " + j, cond: ok2 ? "true" : "false", action: null, out: null,
          note: "Test: is " + j + " ≤ 4? " + (ok2 ? "Yes." : "No — stop.") });
        if (!ok2) { steps.push({ line: 2, vars: "i = " + j, cond: null, action: "exit", out: null,
          note: "Test failed. The for loop is finished." }); break; }
        steps.push({ line: 1, vars: "i = " + j, cond: null, action: "body", out: String(j),
          note: "Body: print " + j + "." });
        steps.push({ line: 0, vars: "i = " + (j + 1), cond: null, action: "step", out: null,
          note: "Step i++ : i becomes " + (j + 1) + ", then test again." });
        j = j + 1;
      }
    } else if (kind === "break") {
      // for (i=1; i<=6; i++){ if(i==4) break; cout<<i; }
      steps.push({ line: 0, vars: "i = 1", cond: null, action: "init", out: null, note: "Start: i = 1." });
      var k = 1;
      while (true) {
        steps.push({ line: 0, vars: "i = " + k, cond: "true", action: null, out: null,
          note: "Test: " + k + " ≤ 6? Yes." });
        var hit = (k === 4);
        steps.push({ line: 1, vars: "i = " + k, cond: hit ? "true" : "false", action: null, out: null,
          note: "Is i == 4? " + (hit ? "Yes — run break!" : "No — skip the break.") });
        if (hit) {
          steps.push({ line: 1, vars: "i = " + k, cond: null, action: "break", out: null,
            note: "break! Jump straight out of the loop — even though i is only 4." });
          steps.push({ line: 4, vars: "i = " + k, cond: null, action: "exit", out: null,
            note: "The loop is abandoned. 4, 5, 6 never print." });
          break;
        }
        steps.push({ line: 2, vars: "i = " + k, cond: null, action: "body", out: String(k),
          note: "Print " + k + "." });
        steps.push({ line: 0, vars: "i = " + (k + 1), cond: null, action: "step", out: null,
          note: "i++ → " + (k + 1) + ", loop back." });
        k = k + 1;
      }
    } else if (kind === "continue") {
      // for (i=1; i<=5; i++){ if(i==3) continue; cout<<i; }
      steps.push({ line: 0, vars: "i = 1", cond: null, action: "init", out: null, note: "Start: i = 1." });
      var m = 1;
      while (true) {
        var ok3 = m <= 5;
        steps.push({ line: 0, vars: "i = " + m, cond: ok3 ? "true" : "false", action: null, out: null,
          note: "Test: " + m + " ≤ 5? " + (ok3 ? "Yes." : "No — stop.") });
        if (!ok3) { steps.push({ line: 4, vars: "i = " + m, cond: null, action: "exit", out: null,
          note: "Loop finished." }); break; }
        var skip = (m === 3);
        steps.push({ line: 1, vars: "i = " + m, cond: skip ? "true" : "false", action: null, out: null,
          note: "Is i == 3? " + (skip ? "Yes — run continue." : "No.") });
        if (skip) {
          steps.push({ line: 1, vars: "i = " + m, cond: null, action: "skip", out: null,
            note: "continue! Skip the rest of THIS pass — 3 is not printed — and go to i++." });
        } else {
          steps.push({ line: 2, vars: "i = " + m, cond: null, action: "body", out: String(m),
            note: "Print " + m + "." });
        }
        steps.push({ line: 0, vars: "i = " + (m + 1), cond: null, action: "step", out: null,
          note: "i++ → " + (m + 1) + ", loop back." });
        m = m + 1;
      }
    }
    return steps;
  }

  var CODE = {
    while: ["int i = 1;", "while (i <= 3) {", "    cout << i;", "    i = i + 1;", "}"],
    for:   ["for (int i = 1; i <= 4; i++)", "    cout << i;", "// loop ends"],
    break: ["for (int i = 1; i <= 6; i++) {", "    if (i == 4) break;", "    cout << i;", "}", "// after the loop"],
    continue: ["for (int i = 1; i <= 5; i++) {", "    if (i == 3) continue;", "    cout << i;", "}", "// after the loop"]
  };

  var TITLE = {
    while: "while loop", for: "for loop", break: "break", continue: "continue"
  };

  function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  function build(widget) {
    if (widget.__built) return; widget.__built = true;
    var kind = widget.getAttribute("data-kind") || "while";
    var code = CODE[kind] || CODE.while;
    var steps = buildSteps(kind);

    widget.innerHTML =
      '<div class="lvz-head">' +
        '<span class="lvz-title">' + TITLE[kind] + '</span>' +
        '<div class="lvz-ctrls">' +
          '<button class="lvz-btn lvz-play" type="button">▶ Play</button>' +
          '<button class="lvz-btn lvz-step" type="button">⏭ Step</button>' +
          '<button class="lvz-btn lvz-reset" type="button">↺ Reset</button>' +
        '</div>' +
      '</div>' +
      '<div class="lvz-body">' +
        '<div class="lvz-left">' +
          '<pre class="lvz-code">' + code.map(function(l,idx){
            return '<span class="lvz-line" data-l="'+idx+'">' + (esc(l)||"&nbsp;") + '</span>';
          }).join("\n") + '</pre>' +
        '</div>' +
        '<div class="lvz-right">' +
          '<div class="lvz-counter"><span class="lvz-clabel">counter</span><span class="lvz-cval">i = 1</span></div>' +
          '<div class="lvz-cond lvz-cond-idle"><span class="lvz-condtxt">condition</span></div>' +
          '<div class="lvz-flowtag"></div>' +
          '<div class="lvz-outwrap"><span class="lvz-olabel">output</span><div class="lvz-out"></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="lvz-bubble">Press ▶ Play (or Step) to watch the loop run.</div>';

    var lines = widget.querySelectorAll(".lvz-line");
    var cval = widget.querySelector(".lvz-cval");
    var cond = widget.querySelector(".lvz-cond");
    var condtxt = widget.querySelector(".lvz-condtxt");
    var flowtag = widget.querySelector(".lvz-flowtag");
    var out = widget.querySelector(".lvz-out");
    var bubble = widget.querySelector(".lvz-bubble");
    var playBtn = widget.querySelector(".lvz-play");
    var stepBtn = widget.querySelector(".lvz-step");
    var resetBtn = widget.querySelector(".lvz-reset");

    var pos = -1, timer = null, playing = false;

    function clearLines(){ lines.forEach(function(l){ l.classList.remove("on"); }); }
    function render(s) {
      clearLines();
      var ln = widget.querySelector('.lvz-line[data-l="'+s.line+'"]');
      if (ln) ln.classList.add("on");
      cval.textContent = s.vars;
      // condition box
      cond.className = "lvz-cond " + (s.cond === "true" ? "lvz-cond-true" : s.cond === "false" ? "lvz-cond-false" : "lvz-cond-idle");
      condtxt.textContent = s.cond === "true" ? "TRUE ✓" : s.cond === "false" ? "FALSE ✗" : "condition";
      // flow tag (loop back / break / skip / exit)
      var map = { back:"⟲ loop back", "break":"⮣ break out!", skip:"↷ skip this pass",
                  exit:"↓ exit loop", step:"i++ step", body:"run body", init:"start" };
      flowtag.textContent = map[s.action] || "";
      flowtag.className = "lvz-flowtag" + (s.action ? (" act-" + s.action) : "");
      // output
      if (s.out !== null && s.out !== undefined) {
        var chip = document.createElement("span");
        chip.className = "lvz-chip"; chip.textContent = s.out;
        out.appendChild(chip);
      }
      bubble.textContent = s.note;
    }
    function rebuildOutUpTo(n) {
      out.innerHTML = "";
      for (var x = 0; x <= n; x++) {
        var st = steps[x];
        if (st && st.out !== null && st.out !== undefined) {
          var chip = document.createElement("span"); chip.className = "lvz-chip"; chip.textContent = st.out; out.appendChild(chip);
        }
      }
    }
    function step() {
      if (pos >= steps.length - 1) { stop(); return; }
      pos++;
      // when stepping we only append the newest output; render handles that
      // but to be safe on jumps, rebuild output deterministically:
      var s = steps[pos];
      clearLines();
      var ln = widget.querySelector('.lvz-line[data-l="'+s.line+'"]'); if (ln) ln.classList.add("on");
      cval.textContent = s.vars;
      cond.className = "lvz-cond " + (s.cond === "true" ? "lvz-cond-true" : s.cond === "false" ? "lvz-cond-false" : "lvz-cond-idle");
      condtxt.textContent = s.cond === "true" ? "TRUE ✓" : s.cond === "false" ? "FALSE ✗" : "condition";
      var map = { back:"⟲ loop back", "break":"⮣ break out!", skip:"↷ skip this pass",
                  exit:"↓ exit loop", step:"i++ step", body:"run body", init:"start" };
      flowtag.textContent = map[s.action] || "";
      flowtag.className = "lvz-flowtag" + (s.action ? (" act-" + s.action) : "");
      rebuildOutUpTo(pos);
      bubble.textContent = s.note;
      if (pos >= steps.length - 1) stop();
    }
    function play() {
      if (playing) return;
      if (pos >= steps.length - 1) reset();
      playing = true; playBtn.innerHTML = "⏸ Pause"; playBtn.classList.add("playing");
      timer = setInterval(function(){
        if (pos >= steps.length - 1) { stop(); return; }
        step();
      }, 1150);
      if (pos < 0) step();
    }
    function stop() {
      playing = false; if (timer) { clearInterval(timer); timer = null; }
      playBtn.innerHTML = "▶ Play"; playBtn.classList.remove("playing");
    }
    function reset() {
      stop(); pos = -1; clearLines(); out.innerHTML = "";
      cval.textContent = steps.length ? steps[0].vars : "i = 1";
      cond.className = "lvz-cond lvz-cond-idle"; condtxt.textContent = "condition";
      flowtag.textContent = ""; flowtag.className = "lvz-flowtag";
      bubble.textContent = "Press ▶ Play (or Step) to watch the loop run.";
    }

    playBtn.addEventListener("click", function(){ playing ? stop() : play(); });
    stepBtn.addEventListener("click", function(){ stop(); step(); });
    resetBtn.addEventListener("click", reset);

    // Pause when the slide is left (reveal.js), so it doesn't run off-screen.
    if (window.Reveal && Reveal.on) {
      Reveal.on("slidechanged", function(){ stop(); });
    }
  }

  function initAll() {
    document.querySelectorAll(".loopviz-widget").forEach(build);
  }
  if (document.readyState !== "loading") initAll();
  else document.addEventListener("DOMContentLoaded", initAll);
  if (window.Reveal && Reveal.on) Reveal.on("ready", initAll);
  window.LoopVizInit = initAll;
})();
