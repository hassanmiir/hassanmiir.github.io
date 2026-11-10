/* Shared reveal.js bootstrap for every lecture deck.
   Each lecture's index.html includes reveal CSS/JS from CDN, then this file. */
window.addEventListener('DOMContentLoaded', function () {
  if (typeof Reveal === 'undefined') { console.error('Reveal not loaded'); return; }
  Reveal.initialize({
    hash: true,
    slideNumber: 'c/t',
    controls: true,
    progress: true,
    center: false,         // slides are laid out top-aligned (theme design)
    transition: 'slide',
    width: 1280,
    height: 720,
    margin: 0,             // fill the screen edge-to-edge (no letterbox gaps)
    minScale: 0.2,
    maxScale: 2.0,
    fragments: false,      // show every slide's full content at once — the
                           // arrow keys move slide-to-slide, never click-by-click
    plugins: (window.RevealHighlight ? [RevealHighlight] : [])
      .concat(window.RevealNotes ? [RevealNotes] : [])
  });

  // Show EVERYTHING on a slide the moment you arrive — no clicking through
  // fragments. Each slide's full content is visible as soon as it's active,
  // for presenter and students alike. (Loop-visualizer output is animation
  // state, not fragments, so it is unaffected and still plays step by step.)
  function revealAllFragments() {
    var slide = Reveal.getCurrentSlide && Reveal.getCurrentSlide();
    if (!slide) return;
    slide.querySelectorAll('.fragment').forEach(function (f) {
      f.classList.add('visible');
      f.classList.remove('current-fragment');
    });
  }
  Reveal.on('ready', revealAllFragments);
  Reveal.on('slidechanged', revealAllFragments);
  // Also catch the rare case where fragments get re-hidden on resize/overview.
  Reveal.on('overviewhidden', revealAllFragments);
});
