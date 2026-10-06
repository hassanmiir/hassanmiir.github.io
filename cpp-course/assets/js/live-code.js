/* ============================================================
   live-code.js — in-slide C++ editor + runner
   Reusable across all lectures. Compiles & runs C++ in the
   browser via the bundled JSCPP interpreter (no server).
   A "Open in OnlineGDB" button sends the same code to a full
   online IDE for programs that need the complete STL.

   Usage in a slide:
     <div class="live-code" data-stdin="Ana&#10;20">
   #include &lt;iostream&gt;
   using namespace std;
   int main(){ cout &lt;&lt; "Hi"; }
     </div>
   The element's text content is the starting program (HTML-escaped).
   Optional data-stdin supplies input lines (use &#10; for newlines).
   ============================================================ */
(function () {
  function decodeStdin(v) {
    if (!v) return "";
    // allow literal \n in the attribute
    return v.replace(/\\n/g, "\n");
  }

  function runCpp(code, stdin, outEl, statusEl) {
    outEl.textContent = "";
    statusEl.textContent = "Running…";
    statusEl.className = "lc-status running";
    // defer so the UI paints "Running…" first
    setTimeout(function () {
      if (typeof JSCPP === "undefined") {
        statusEl.textContent = "Runner not loaded";
        statusEl.className = "lc-status err";
        outEl.textContent = "The in-browser runner didn't load. Use “Open in OnlineGDB” instead.";
        return;
      }
      var out = "";
      var config = {
        stdio: { write: function (s) { out += s; } },
        unsigned_overflow: "warn"
      };
      try {
        var exit = JSCPP.run(code, stdin, config);
        outEl.textContent = out + (out.endsWith("\n") || out === "" ? "" : "\n");
        statusEl.textContent = "Finished · exit " + exit;
        statusEl.className = "lc-status ok";
      } catch (e) {
        outEl.textContent = (out ? out + "\n" : "") + "⚠ " + (e && e.message ? e.message : e);
        statusEl.textContent = "Error";
        statusEl.className = "lc-status err";
      }
    }, 30);
  }

  function openInGDB(code) {
    // OnlineGDB doesn't accept code via URL, so copy to clipboard and open.
    try { navigator.clipboard && navigator.clipboard.writeText(code); } catch (e) {}
    window.open("https://www.onlinegdb.com/online_c++_compiler", "_blank");
  }

  function build(el) {
    var startCode = el.textContent.replace(/^\n+|\s+$/g, "");
    var stdin = decodeStdin(el.getAttribute("data-stdin"));
    var rows = Math.max(startCode.split("\n").length + 1, 5);
    el.textContent = "";
    el.classList.add("lc-ready");

    el.innerHTML =
      '<div class="lc-bar">' +
        '<span class="lc-dot r"></span><span class="lc-dot y"></span><span class="lc-dot g"></span>' +
        '<span class="lc-title">main.cpp</span>' +
        '<button class="lc-run" type="button">▶ Run</button>' +
        '<button class="lc-reset" type="button" title="Restore the starter code">↺</button>' +
        '<button class="lc-gdb" type="button" title="Copy code &amp; open a full online compiler">Open in OnlineGDB ▸</button>' +
      '</div>' +
      '<textarea class="lc-editor" spellcheck="false" rows="' + rows + '"></textarea>' +
      '<div class="lc-outwrap">' +
        '<div class="lc-outhead"><span>Output</span><span class="lc-status">Ready</span></div>' +
        '<pre class="lc-out"></pre>' +
      '</div>';

    var ta = el.querySelector(".lc-editor");
    var out = el.querySelector(".lc-out");
    var status = el.querySelector(".lc-status");
    ta.value = startCode;

    // Tab inserts spaces instead of moving focus
    ta.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        e.preventDefault();
        var s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + "    " + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + 4;
      }
      // Ctrl/Cmd+Enter runs
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCpp(ta.value, stdin, out, status);
      }
    });

    el.querySelector(".lc-run").addEventListener("click", function () {
      runCpp(ta.value, stdin, out, status);
    });
    el.querySelector(".lc-reset").addEventListener("click", function () {
      ta.value = startCode; out.textContent = ""; status.textContent = "Ready"; status.className = "lc-status";
    });
    el.querySelector(".lc-gdb").addEventListener("click", function () {
      openInGDB(ta.value);
      status.textContent = "Code copied — paste into OnlineGDB";
      status.className = "lc-status ok";
    });
  }

  function init() {
    var nodes = document.querySelectorAll(".live-code:not(.lc-ready)");
    nodes.forEach(build);
  }

  // Build on load, and rebuild when reveal reveals a slide (editors added later)
  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", init);
  if (window.Reveal && Reveal.on) Reveal.on("ready", init);
  window.LiveCodeInit = init;
})();
