/* Shared reveal.js bootstrap for every lecture deck.
   Each lecture's index.html includes reveal CSS/JS from CDN, then this file. */
window.addEventListener('DOMContentLoaded', function () {
  if (typeof Reveal === 'undefined') { console.error('Reveal not loaded'); return; }
  Reveal.initialize({
    hash: true,
    slideNumber: 'c/t',
    controls: true,
    progress: true,
    center: false,
    transition: 'slide',
    width: 1280,
    height: 720,
    margin: 0,
    plugins: (window.RevealHighlight ? [RevealHighlight] : [])
      .concat(window.RevealNotes ? [RevealNotes] : [])
  });
});
