# Programming with C++ — A Hands-On Course for Absolute Beginners

Ten lectures, each with a browser-based slide deck and a live coding activity,
plus two console-C++ capstone projects. Everything is static HTML, so it runs
directly from **GitHub Pages** — students scan a QR code and the lecture opens
on their phone or laptop.

**Instructor:** Mir Hassan · Mykolas Romeris University, Vilnius

---

## What's inside

```
cpp-course/
├── index.html              ← course home (lists all lectures + projects)
├── course.json             ← single source of truth: titles, goals, URLs
├── generate_qr.py          ← regenerates all QR codes from course.json
├── assets/
│   ├── css/theme.css       ← shared slide theme (all decks inherit it)
│   ├── css/live-code.css   ← styling for the in-slide code editor
│   ├── css/animations.css  ← hero motion, floating glyphs, QR pulse
│   ├── css/gate.css        ← password overlay styling
│   ├── js/deck.js          ← shared reveal.js setup
│   ├── js/live-code.js     ← in-slide C++ editor + Run button (reusable)
│   ├── js/activities.js    ← quiz + click-to-reveal + floating glyphs
│   ├── js/gate.js          ← password gate
│   ├── js/counter.js       ← live "opened today" counter
│   ├── js/course-data.js   ← course.json inlined for the home page
│   ├── icons/              ← icon set used on slides and the home page
│   └── vendor/
│       ├── reveal/         ← reveal.js, bundled locally (works offline)
│       └── jscpp/          ← in-browser C++ compiler (runs code client-side)
├── lecture1/
│   ├── index.html          ← Lecture 1 deck (template for the rest)
│   └── lecture1-qr.png     ← this lecture's QR code (shown on slide 1)
├── projects/
│   ├── student-tool.html   ← Capstone A — Student Study Buddy
│   └── teacher-tool.html   ← Capstone B — Teacher Gradebook
└── qr/
    ├── index.html          ← printable sheet of every QR code
    └── *.png               ← one QR per lecture + home + projects
```

---

## Publish it on GitHub Pages

This site is built to live in a **`cpp-course` subfolder** of your existing
`hassanmiir.github.io` repository, so it serves at:

```
https://hassanmiir.github.io/cpp-course/
https://hassanmiir.github.io/cpp-course/lecture1/
```

**Steps:**

1. Copy the whole **`cpp-course`** folder into the root of your
   `hassanmiir.github.io` repository (so you have `hassanmiir.github.io/cpp-course/…`).
2. Make sure there's an empty **`.nojekyll`** file at the **repo root**
   (`hassanmiir.github.io/.nojekyll`). GitHub Pages needs it so the
   `assets/vendor/` folders serve correctly. (A copy also sits inside
   `cpp-course/` as a safety net.)
3. Commit and push:
   ```bash
   cd hassanmiir.github.io
   git add cpp-course .nojekyll
   git commit -m "Add C++ course"
   git push
   ```
4. Your repo already serves GitHub Pages, so within ~1 minute the course is live
   at `https://hassanmiir.github.io/cpp-course/`.

> Everything is already wired to this URL — the home page, the lecture links,
> and the QR codes all point at `hassanmiir.github.io/cpp-course`. If you ever
> move it, change `baseUrl` in `course.json` and re-run the sync below.

---

## Point the QR codes at your real URL

The QR codes ship with a placeholder URL. After you know your Pages address:

1. Edit **`course.json`** and set `baseUrl` to your site, e.g.
   `"baseUrl": "https://YOURNAME.github.io/cpp-course"`.
2. Regenerate the codes and the home-page data:
   ```bash
   python generate_qr.py
   python -c "import json;d=json.load(open('course.json'));open('assets/js/course-data.js','w').write('window.COURSE = '+json.dumps(d,indent=2)+';\n')"
   ```
   (Or pass the URL once without editing the file:
   `python generate_qr.py https://YOURNAME.github.io/cpp-course`)
3. Commit and push. Open **`qr/index.html`** to print all codes on one sheet.

Requires Python with `qrcode` and `pillow`: `pip install "qrcode[pil]"`.

---

## Live code in the slides

Lecture decks include **in-slide C++ editors**: students edit the code and click
**▶ Run** to see the output right there — no install, no account, no server. The
code compiles and runs *in the browser* (via a bundled C++ interpreter), so a
whole class can run code at once with no rate limits. Each editor also has:

- **↺ Reset** — restore the starter code.
- **Open in OnlineGDB ▸** — copies the code and opens a full online IDE, for
  programs that use the complete standard library (`std::string`, `std::vector`,
  files) — e.g. the capstone project.

> The in-slide runner covers everything in Lecture 1 (`cout`, `cin`, numbers,
> loops, `char` text). From Lecture 2, when `std::string` and `std::vector`
> appear, use **Open in OnlineGDB** for those programs. Drop an editor into any
> slide with `<div class="live-code"> … C++ code … </div>`.

## Unlocking lectures by date

Each lecture in `course.json` has an **`unlockDate`** (`YYYY-MM-DD`). Before that
date the lecture is **locked** on the home page (greyed out, "🔒 Unlocks …") and
not clickable; on the day, it opens automatically. Lecture 1 has an empty
`unlockDate`, so it's always open. Edit the dates to match your real schedule,
then re-sync the home-page data (see "Point the QR codes…" below — the same
one-liner regenerates `course-data.js`). The dates are currently set to weekly
Tuesdays starting Oct 13, 2026 as placeholders.

## Password gate (lecture-day access)

Each lecture page shows a **password overlay** before the slides. Students type
the shared password you give them in class; the deck stays hidden until they do,
and once entered it's remembered for that browser session (a refresh won't
re-prompt).

- Set the password in **`course.json → access.password`** (currently `cpp2026`).
  Change it each class day if you like, then re-sync `course-data.js` (same
  one-liner as the QR step) and push.
- Turn it off entirely with `access.enabled: false`.

> **Honest limitation:** this is a *"don't open early"* deterrent, not strong
> security. A static GitHub Pages site can't keep a true secret — a determined
> student could read the password in the page source. It's perfect for keeping
> the class in step; it won't stop someone determined to peek. For real access
> control you'd need a backend (e.g. Cloudflare Access), which GitHub Pages
> alone can't provide.

## Seeing how many students opened a lecture

The scan-in slide shows a live **"👁 N opened today"** counter. It increments
once per student browser (a refresh doesn't double-count) using the free,
no-signup [Abacus](https://abacus.jasoncameron.dev) service, and each lecture-day
gets its own tally. If the service is ever unreachable, the badge quietly shows
`—` instead of breaking the slide.

**Check the count without inflating it** (e.g. before class): open this URL in a
browser — it reads the number without counting your own visit. Replace the date
with today's (`YYYY-MM-DD`):

```
https://abacus.jasoncameron.dev/get/hassanmiir-cpp-course/lecture1_2026-10-06
```

(The namespace `hassanmiir-cpp-course` is set in `assets/js/counter.js`.)

## Running it in class

- **Project the deck:** open a lecture, press **F** for fullscreen. Arrow keys
  or swipe to move. **S** opens speaker notes, **Esc** shows the slide overview.
- **Students follow along:** show the lecture's QR code (from `qr/index.html` or
  the sheet you printed). They scan it and read the same slides on their device.
- **Hands-on:** each deck ends with an activity. Students write C++ in any
  compiler — on their machine (`g++`) or online at
  [onlinegdb.com](https://www.onlinegdb.com) or [godbolt.org](https://godbolt.org).

---

## The ten lectures

| # | Title | Hands-on |
|---|-------|----------|
| 1 | First Steps in C++ | Write & run "Hello, World", then personalize it |
| 2 | Variables and Data Types | Greet the user by name and age |
| 3 | Operators and Expressions | A simple calculator |
| 4 | Making Decisions | A grade classifier |
| 5 | Loops | Multiplication table; sum 1..N |
| 6 | Functions | Refactor the calculator into functions |
| 7 | Arrays and Vectors | Average and highest of a score list |
| 8 | Strings and Text | Count words, characters, vowels |
| 9 | Structs and Simple Objects | Model a Student; print a roster |
| 10 | Files and Putting It Together | Save/load the roster; finish the capstone |

Each lecture builds one more piece of the capstone project, so by Lecture 10
every group has a finished, working tool.

---

## Adding the remaining lectures

Lecture 1 (`lectures/lecture01/index.html`) is the template. To add Lecture *n*:

1. Copy the `lecture01` folder to `lecture0n`.
2. Keep the `<head>` (same CSS/JS paths) and the first/last structural slides.
3. Replace the middle slides with the new topic's content, reusing the same
   building blocks: `.cards`, `.note`, `.iconrow`, `.code-head` + `<pre>`, and
   the `.slide-handson` section for the activity.
4. The home page and QR codes pick it up automatically once it's listed in
   `course.json` (it already lists all ten).

---

## Credits

Slides built with [reveal.js](https://revealjs.com) (MIT), bundled locally.
Icons from [Font Awesome Free](https://fontawesome.com) (CC BY 4.0).
Course content © Mir Hassan.
