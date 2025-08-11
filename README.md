# Mir Hassan — Academic Homepage

Single-file academic website ready for GitHub Pages.

## How to publish on GitHub Pages

1. Create a new public repo named **mir-hassan.github.io** (or any repo and enable Pages).
2. Upload these files (or `git push`).
3. Ensure `index.html` is at the repo root.
4. Add your CV at `cv/Mir_Hassan_CV.pdf` and your portrait at `assets/avatar.jpg`.
5. In the repo **Settings → Pages**, set Source to `Deploy from a branch` → `main` → `/ (root)`.
6. Wait ~1–2 minutes, then open: `https://<your-username>.github.io/`.

## Local preview

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Customize

- Update links to Google Scholar, GitHub, LinkedIn in **index.html**.
- Edit About/News/Publications sections directly.
- Optional: create a `CNAME` file with your custom domain.
