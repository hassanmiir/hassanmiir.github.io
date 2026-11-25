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
    } else if (kind === "function") {
      // int square(int n){ return n*n; }  ...  cout << square(5);
      steps.push({ line: 4, vars: "—", cond: null, action: "init", out: null,
        note: "main starts. We are about to call square(5)." });
      steps.push({ line: 4, vars: "arg: 5", cond: null, action: "call", out: null,
        note: "CALL: the value 5 is passed in. Control jumps up to the function." });
      steps.push({ line: 0, vars: "n = 5", cond: null, action: "body", out: null,
        note: "Inside square: the parameter n receives a COPY of 5." });
      steps.push({ line: 1, vars: "n*n = 25", cond: "true", action: "return", out: null,
        note: "return n*n → the function computes 25 and hands it back." });
      steps.push({ line: 4, vars: "square(5) = 25", cond: null, action: "back", out: "25",
        note: "Control returns to main. The call square(5) became the value 25." });
      steps.push({ line: 5, vars: "result = 25", cond: null, action: "exit", out: "25",
        note: "main prints 25. One function, reusable for any number." });
    } else if (kind === "array") {
      // int s[5] = {90,72,55,88,63}; indexing + a loop sum
      var arr = [90, 72, 55, 88, 63];
      steps.push({ line: 0, vars: "size = 5", cond: null, action: "init", out: null,
        note: "An array holds 5 scores in a row. Boxes are numbered from 0." });
      steps.push({ line: 1, vars: "s[0] = 90", cond: null, action: "index0", out: null,
        note: "s[0] is the FIRST box — index 0, not 1. This is the #1 beginner trap." });
      steps.push({ line: 1, vars: "s[4] = 63", cond: null, action: "index4", out: null,
        note: "s[4] is the LAST box. 5 items → valid indexes 0,1,2,3,4." });
      var total = 0;
      for (var a = 0; a < arr.length; a++) {
        total += arr[a];
        steps.push({ line: 3, vars: "i=" + a + ", total=" + total, cond: null, action: "idx" + a, out: String(total),
          note: "Loop reads s[" + a + "] = " + arr[a] + ", adds it → total = " + total + "." });
      }
      steps.push({ line: 5, vars: "total = " + total, cond: "true", action: "exit", out: String(total),
        note: "The loop visited every box. Sum = " + total + ". (Average = " + Math.round(total/arr.length*10)/10 + ".)" });
    }
    return steps;
  }

  // Arrays the array-kind visual draws as a row of indexed cells.
  var ARRAY_CELLS = [90, 72, 55, 88, 63];

  var CODE = {
    while: ["int i = 1;", "while (i <= 3) {", "    cout << i;", "    i = i + 1;", "}"],
    for:   ["for (int i = 1; i <= 4; i++)", "    cout << i;", "// loop ends"],
    break: ["for (int i = 1; i <= 6; i++) {", "    if (i == 4) break;", "    cout << i;", "}", "// after the loop"],
    continue: ["for (int i = 1; i <= 5; i++) {", "    if (i == 3) continue;", "    cout << i;", "}", "// after the loop"],
    function: ["int square(int n) {", "    return n * n;", "}", "", "int main() {", "    cout << square(5);", "}"],
    array: ["int s[5] = {90,72,55,88,63};", "// s[0] .. s[4]", "int total = 0;", "for (int i=0;i<5;i++) total += s[i];", "", "cout << total;"]
  };

  var TITLE = {
    while: "while loop", for: "for loop", break: "break", continue: "continue",
    function: "function call & return", array: "array: index & sum"
  };
  // Label on the state box, per kind.
  var VARLABEL = {
    while: "counter", for: "counter", break: "counter", continue: "counter",
    function: "state", array: "state"
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
          (kind === "array" ?
            '<div class="lvz-cells">' + ARRAY_CELLS.map(function(v,ci){
              return '<div class="lvz-cell" data-ci="'+ci+'"><span class="lvz-cv">'+v+'</span><span class="lvz-ci">['+ci+']</span></div>';
            }).join("") + '</div>' : "") +
          '<div class="lvz-counter"><span class="lvz-clabel">' + (VARLABEL[kind]||"counter") + '</span><span class="lvz-cval">—</span></div>' +
          '<div class="lvz-cond lvz-cond-idle"><span class="lvz-condtxt">' + (kind==="function"?"returning":kind==="array"?"status":"condition") + '</span></div>' +
          '<div class="lvz-flowtag"></div>' +
          '<div class="lvz-outwrap"><span class="lvz-olabel">' + (kind==="function"?"result":kind==="array"?"running total":"output") + '</span><div class="lvz-out"></div></div>' +
        '</div>' +
      '</div>' +
      '<div class="lvz-bubble">Press ▶ Play (or Step) to watch it run.</div>';

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

    var cells = widget.querySelectorAll(".lvz-cell");
    var FLOWMAP = { back:"⟲ loop back", "break":"⮣ break out!", skip:"↷ skip this pass",
                  exit:"↓ exit / done", step:"i++ step", body:"run body", init:"start",
                  call:"→ call the function", "return":"⬅ return a value",
                  index0:"point at s[0]", index4:"point at s[4]",
                  idx0:"read s[0]", idx1:"read s[1]", idx2:"read s[2]", idx3:"read s[3]", idx4:"read s[4]" };
    var CONDTXT = { def:"condition", function:"returning", array:"status" };
    function clearLines(){ lines.forEach(function(l){ l.classList.remove("on"); }); }
    function highlightCell(action){
      if (!cells.length) return;
      cells.forEach(function(c){ c.classList.remove("on"); });
      var ci = null;
      if (action === "index0") ci = 0; else if (action === "index4") ci = 4;
      else if (/^idx(\d)$/.test(action)) ci = parseInt(action.slice(3),10);
      if (ci !== null && cells[ci]) cells[ci].classList.add("on");
    }
    function applyStep(s){
      clearLines();
      var ln = widget.querySelector('.lvz-line[data-l="'+s.line+'"]');
      if (ln) ln.classList.add("on");
      cval.textContent = s.vars;
      cond.className = "lvz-cond " + (s.cond === "true" ? "lvz-cond-true" : s.cond === "false" ? "lvz-cond-false" : "lvz-cond-idle");
      condtxt.textContent = s.cond === "true" ? (kind==="function"?"RETURN ✓":kind==="array"?"DONE ✓":"TRUE ✓")
                          : s.cond === "false" ? "FALSE ✗" : (CONDTXT[kind]||CONDTXT.def);
      flowtag.textContent = FLOWMAP[s.action] || "";
      flowtag.className = "lvz-flowtag" + (s.action ? (" act-" + s.action) : "");
      highlightCell(s.action);
      bubble.textContent = s.note;
    }
    function render(s) {
      applyStep(s);
      if (s.out !== null && s.out !== undefined) {
        var chip = document.createElement("span");
        chip.className = "lvz-chip"; chip.textContent = s.out;
        out.appendChild(chip);
      }
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
      var s = steps[pos];
      applyStep(s);
      rebuildOutUpTo(pos);
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
    function reset(msg) {
      stop(); pos = -1; clearLines(); out.innerHTML = "";
      if (cells.length) cells.forEach(function(c){ c.classList.remove("on"); });
      cval.textContent = steps.length ? steps[0].vars : "—";
      cond.className = "lvz-cond lvz-cond-idle"; condtxt.textContent = (CONDTXT[kind]||CONDTXT.def);
      flowtag.textContent = ""; flowtag.className = "lvz-flowtag";
      var defMsg = kind==="function" ? "Watch the call hand over control — and the value come back."
                 : kind==="array" ? "Watch each box get read, one index at a time."
                 : "The loop runs automatically — watch each step.";
      bubble.textContent = msg || defMsg;
    }

    playBtn.addEventListener("click", function(){ playing ? stop() : play(); });
    stepBtn.addEventListener("click", function(){ stop(); step(); });
    resetBtn.addEventListener("click", function(){ reset(); });

    // Expose controls so the auto-runner can start/stop this widget.
    widget.__lvz = {
      autorun: function(){ reset(); setTimeout(function(){ play(); }, 550); },
      stop: stop,
      reset: reset
    };
    // Start idle (auto-run is triggered when its slide becomes active).
    reset();
  }

  function initAll() {
    document.querySelectorAll(".loopviz-widget").forEach(build);
  }

  // Auto-run the visualizer(s) on whichever slide is now showing, and stop any
  // others — so arriving on a visualizer slide plays it with NO click needed.
  var lastRun = null;
  function runActiveSlide() {
    var cur = (window.Reveal && Reveal.getCurrentSlide) ? Reveal.getCurrentSlide() : document;
    document.querySelectorAll(".loopviz-widget").forEach(function(w){
      if (!w.__lvz) return;
      if (cur && cur.contains(w)) {
        if (lastRun !== w) { lastRun = w; w.__lvz.autorun(); }
      } else {
        w.__lvz.stop();
      }
    });
  }

  if (document.readyState !== "loading") initAll();
  else document.addEventListener("DOMContentLoaded", initAll);
  if (window.Reveal && Reveal.on) {
    Reveal.on("ready", function(){ initAll(); runActiveSlide(); });
    Reveal.on("slidechanged", function(){ lastRun = null; runActiveSlide(); });
  } else {
    // No reveal (plain page): just run any visualizer present.
    window.addEventListener("load", function(){ initAll(); document.querySelectorAll(".loopviz-widget").forEach(function(w){ if(w.__lvz) w.__lvz.autorun(); }); });
  }
  window.LoopVizInit = initAll;
  window.LoopVizRun = runActiveSlide;
})();
