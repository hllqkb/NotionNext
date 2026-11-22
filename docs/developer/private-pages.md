# Private pages under /p

Keep private source material outside this repository and the public Notion database. Commit the encrypted JSON for each page to `data/private/<id>.json`.

## Add or replace a page

1. Choose a random 16-character hexadecimal ID. Reuse the existing ID to keep a page's URL.
2. Render the source to an HTML fragment and prepare the payload `{ title, html }`. Include only trusted HTML because the browser inserts it directly into the article.
3. In your local encryption script, call `encryptPostPayload({ title, html }, passwordDigest, 'private-pages')` from `lib/server/postEncryption.js`. The digest is the hexadecimal SHA-256 of the UTF-8 password. Use the same password and the exact post ID `private-pages` for every page. The shared post ID gives all pages the same salt, and the helper generates a fresh IV for each encryption.
4. Save the helper's output `{ v, iter, salt, iv, data }` to `data/private/<id>.json`. Keep the plaintext, password, and digest out of the repo.

`pages/p/[id].js` discovers these files at build time. With `EXPORT=true` it writes `out/p/<id>.html`, served by Cloudflare Pages at `/p/<id>`. A directory containing only `.gitkeep` exports zero private pages. Each migrated URL starts working again when its matching JSON is added and deployed.

## Unlocking and indexing

- The reading theme shows the lock form until the browser decrypts the title and body. It saves the derived key in localStorage under the shared post ID, so another private page on the same browser can open automatically. **锁上** clears the saved key and locks the current page.
- Five consecutive rejected passwords trigger a 30-second lockout. Each subsequent failure doubles the delay up to one hour. The count and deadline are shared across private pages via the `private-pages-throttle` localStorage entry. Successful decryption clears both.
- The lockout only applies to attempts through the form. Anyone who downloads the ciphertext can try passwords offline, so use a long, unique password. Rotating the shared password requires re-encrypting all private pages.
- Private routes are excluded from sitemap and search indexes. They are outside the Notion article catalog used for RSS and the home and archive lists. The route sends a robots directive in its HTML, and Cloudflare applies the `/p/*` rules in `public/_headers`.

## Keep a migrated post in the lists

A post whose body moved to a private page can stay Published in Notion with a one-line stub and no `password`. Add its slug (the last path segment, such as `p-8954b68c`) and the private page ID to `themes/reading/privateLinks.js`. The reading theme then shows the lock mark for that post in the home, archive, series and previous/next lists, links those entries straight to `/p/<id>`, and leaves the post out of related posts and the random pick. The stub at `/article/<slug>` keeps working for old links.
