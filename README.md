# Ludwig Schneider Gallery — Website foundation

A static HTML/CSS/JavaScript site for GitHub + Cloudflare Pages. The approved structure is implemented with neutral placeholders. **No artwork information or artist biographies have been invented.**

## Start locally in VS Code

Open this folder in VS Code. Use the **Live Server** extension, or run `python3 -m http.server 8000` in this folder and visit `http://localhost:8000`. Do not open the HTML file by double-clicking: browsers block `fetch()` of local JSON files from `file://` URLs.

## Edit content

- `data/artists.json`: update biographies and representative image paths; add artists using unique `id` values. Existing seven artists are present with empty details.
- `data/artworks.json`: add artwork records using the format below. It starts as an empty array; there are no fabricated artworks.
- `assets/images/`: add actual photographs and artworks, then reference their paths relative to the site root.
- `about/index.html` and `index.html`: update editorial copy using your original content.

Example artwork **structure only**, not a real work (do not paste it without replacing placeholders):

```json
{
  "id": "unique-artwork-id",
  "artist": "jens-peeters",
  "title": "",
  "year": "",
  "medium": "",
  "dimensions": "",
  "description": "",
  "thumbnail": "assets/images/artworks/example.jpg",
  "images": ["assets/images/artworks/example.jpg"]
}
```

To add one, place the object within the JSON array, separated by commas from adjacent records. Missing text fields are automatically hidden in the overlay, except the title and description, which show clear placeholders. Artist ID must match an `id` from `artists.json`. Empty `images` array is fine; carousel arrows hide automatically.

## URLs and sharing

Collection artwork share links use `/collection/?artwork=unique-artwork-id`. From artist profiles, the URL is `/artists/profile.html?artist=jens-peeters&artwork=unique-artwork-id`. Opening a link directly opens its overlay. Share uses native sharing when available or copies the URL. These client-side links work on Cloudflare Pages without special server routing. Per-artwork social-media previews and search metadata would need additional static generation at a later stage.

## Deploy

1. Push this directory to a GitHub repository.
2. In Cloudflare Pages choose **Connect to Git**, select the repository, choose **no framework**, leave build command blank, and set the output directory to `/` (project root).
3. Cloudflare Pages will serve `index.html` automatically and redeploy after each push.

Before going live, check all artwork information, responsive behaviour, image paths, mobile sharing and social preview needs. The existing Google Sites domain can remain unchanged until the replacement is approved.
