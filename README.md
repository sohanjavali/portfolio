# Portfolio

My personal site. Plain HTML, CSS, and a little vanilla JavaScript. No framework, no build step.

## Files

`index.html` holds all the content. `style.css` holds all the styling, including dark mode (follows the system setting via `prefers-color-scheme`). `main.js` draws the agent grid behind the hero, decodes the section labels, fades sections in, and plays the project runs. It is all decoration; the page works without it.

## Updating it

Edit `index.html`, then preview locally:

```bash
python3 -m http.server 4321
```

Open http://localhost:4321, check it, then push:

```bash
git add -A && git commit -m "describe the change" && git push
```

Vercel watches this repo's `main` branch and redeploys on every push, usually in under a minute.

## Rules for the content

No metrics or numbers (those stay on the resume). No m-dashes. Every line has to be something I can explain in an interview.
