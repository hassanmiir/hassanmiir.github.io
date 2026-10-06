# Publish from a PRIVATE repo (source hidden, site public)

This keeps your project files (`.py`, README, folder structure) **private**, while
the built site is served publicly at:

```
https://hassanmiir.github.io/cpp-course/
https://hassanmiir.github.io/cpp-course/lecture1/
```

> **Honest limit:** the slide pages are still HTML/CSS/JS sent to the browser, so
> a student can always press **View Source / F12** and read the page code (and the
> gate password). A private repo hides your *repository and project files* — it
> cannot hide the rendered page code. That is true of every static site.

---

## Important: file placement

The site serves at `/cpp-course/` because the **repo is named `cpp-course`**, not
because of a `cpp-course/` subfolder. So put the course files at the **root of the
new repo** — do **not** nest them inside another `cpp-course/` folder, or the URL
becomes `/cpp-course/cpp-course/…`.

Correct layout of the new repo:

```
cpp-course/                (the repo root)
├── .github/workflows/deploy.yml
├── .nojekyll
├── index.html
├── lecture1/
├── assets/
├── projects/
├── qr/
├── course.json
└── …
```

---

## First: remove it from your public repo

You currently have `cpp-course/` inside your **public** `hassanmiir.github.io`
repo. Leaving it there keeps the source public, defeating the point. Remove it:

```bash
# in your hassanmiir.github.io repo
git rm -r cpp-course
git commit -m "Move C++ course to its own private repo"
git push
```

(Your personal site — homepage, CV, teaching pages — stays untouched.)

---

## One-time setup (about 5 minutes)

1. **Create a new PRIVATE repository** on GitHub named exactly **`cpp-course`**.
   (GitHub → New repository → name `cpp-course` → **Private** → Create.)

2. **Put these files at the repo root** and push:
   ```bash
   # from inside the folder that contains index.html, lecture1/, assets/ …
   git init
   git add .
   git commit -m "C++ course site"
   git branch -M main
   git remote add origin https://github.com/hassanmiir/cpp-course.git
   git push -u origin main
   ```

3. **Turn on Pages via Actions:**
   GitHub → your `cpp-course` repo → **Settings → Pages** →
   under **Build and deployment → Source**, choose **GitHub Actions**.
   (No branch to pick — the included workflow does the deploy.)

4. That's it. The workflow in `.github/workflows/deploy.yml` runs on every push to
   `main`, builds nothing (it's static) and publishes the site. Watch progress in
   the repo's **Actions** tab. First deploy takes 1–2 minutes.

5. Open **https://hassanmiir.github.io/cpp-course/lecture1/** — done.

---

## Updating later

Just push to `main` again; the site redeploys automatically:

```bash
git add .
git commit -m "Update lecture / dates / password"
git push
```

---

## If the URL must stay `/cpp-course/`

Keep the repo name `cpp-course`. If you ever rename the repo, the path changes to
`/<new-name>/`, and you'd need to update `baseUrl` in `course.json`, re-run
`generate_qr.py`, and re-sync `course-data.js` (see the main `README.md`).
