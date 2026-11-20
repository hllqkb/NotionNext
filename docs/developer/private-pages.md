# Private pages under /p

Password-protected posts in the Notion database are not private: the database is publicly shared and its id is in this repo, so the Notion API returns their body and their `password` property to anyone. Content that must stay private is published as a standalone encrypted page instead, and never stored in Notion.

## How a page is made

- The source Markdown stays outside this repo.
- A local script renders it to HTML and encrypts it with AES-GCM-256. The key is derived from a password with PBKDF2-SHA256, 600,000 iterations, and a random salt and IV per page. The password is typed in a terminal and never written anywhere.
- The output is one self-contained HTML file. It holds only the ciphertext and a small decryptor that runs in the browser.

## Where it goes

- The file goes in `public/p/<random hex>.html`. It is not linked from anywhere, and it is not in the sitemap, RSS or Pagefind index: those are built from Notion posts, and the page sets `data-pagefind-ignore`.
- `public/_headers` gives `/p/*` the headers `X-Robots-Tag: noindex, nofollow, noarchive`, `Cache-Control: no-store` and `Referrer-Policy: no-referrer`.

## Notes

- The ciphertext is public in this repo forever, so use a long password that is not used anywhere else.
- To change the password or the content, re-run the script and replace the file.
