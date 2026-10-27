# CookMate 👨‍🍳

A recipe website with search-by-dish, search-by-ingredients, a "Surprise Me!" random recipe picker, and a Favourites page — built with plain HTML, CSS, and JavaScript (no frameworks, no build step).

## Files

- `index.html` — page structure
- `style.css` — all styling
- `script.js` — search, favourites, modal, and view logic
- `data.js` — the recipe data (15 recipes). Add your own by copying the object pattern.

## How to run it in VS Code

1. Unzip this folder and open it in VS Code (`File > Open Folder...`).
2. Install the **Live Server** extension (by Ritwick Dey) from the Extensions panel, if you don't have it already.
3. Right-click `index.html` in the file explorer and choose **"Open with Live Server"**.
4. Your browser will open the site at something like `http://127.0.0.1:5500`.

You can also just double-click `index.html` to open it directly in a browser — everything works without a server since there are no external file fetches.

## Notes

- Recipe photos are rendered as colored gradient tiles with an emoji rather than downloaded images, so the site works completely offline with zero broken links.
- Favourites are saved in your browser's `localStorage`, so they'll persist between visits on the same browser.
- To add a new recipe, add an object to the `RECIPES` array in `data.js` following the existing shape (`id`, `name`, `category`, `time`, `servings`, `emoji`, `gradient`, `ingredients`, `steps`, `tags`). It will automatically show up in searches.
