# Portfolio

My personal site. Plain HTML, CSS, and a little vanilla JavaScript. No framework, no build step.

## Files

`index.html` holds all the content. `style.css` holds all the styling, including dark mode (follows the system setting via `prefers-color-scheme`). `main.js` draws the moving paths behind the hero, runs the auto-hiding scrollbar, decodes the section labels, fades sections in, and plays the project runs. It is all decoration; the page works without it.

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

Numbers only when they're real (from the resume or measured). No m-dashes. Every line has to be something I can explain in an interview.

## Link preview

`og.png` is the image that shows when the link is pasted into iMessage, Slack, LinkedIn, or Gmail. Its source is `og-card.html`: open it in a browser at 1200x630, screenshot it, and save over `og.png`. The text in the preview comes from the `og:` tags at the top of `index.html`.

## Resume

The Resume links point to `sohan-javali-resume.pdf`, a straight copy of the real resume. After updating it, copy it over and push:

```bash
cp ~/Desktop/"Sohan Javali Resume.pdf" sohan-javali-resume.pdf
```

`vercel.json` tells search engines not to index or cache the PDF.
