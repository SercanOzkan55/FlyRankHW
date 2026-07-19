# Notes — A3 Scraper

## Target

[books.toscrape.com](https://books.toscrape.com) — a sandbox site built
specifically for scraping practice. It does not publish a `robots.txt`
(requesting it returns 404), so there are no declared crawl restrictions.
The scraper still checks for one before crawling and would enforce any
`Disallow` rule it found (`src/robots.js`), in case the site ever adds one.

## Politeness / "acting like a bot the owner would allow"

- **Identification**: every request sends a real `User-Agent` string
  identifying the bot and giving a contact point, instead of spoofing a
  browser.
- **Rate limiting**: a fixed 300ms delay before every single HTTP request
  (listing pages and detail pages both go through the same `politeGet()`).
- **robots.txt respected**: checked once at startup; any disallowed path
  is skipped rather than fetched.

## Pipeline

`fetch.js` → `parse.js` → `clean.js` → `index.js` (orchestration), matching
the assignment's fetch → parse → extract → clean → structure stages:

1. **Fetch**: crawl `/catalogue/page-N.html` until there's no "next" link
   (50 pages), collecting each book's detail-page URL along the way.
2. **Parse**: Cheerio loads each response into a queryable DOM.
3. **Extract**: title, price, rating, stock, and — from each book's own
   detail page — UPC, category, description, review count.
4. **Clean**: `"£51.77"` → `{ price: 51.77, currency: "GBP" }`;
   `"In stock (22 available)"` → `{ inStock: true, stockCount: 22 }`;
   `star-rating Three` → `rating: 3`.
5. **Structure**: one JSON object per line, written to `data/books.jsonl`.

## Result

Ran the full crawl end to end: 50 listing pages + 1000 detail pages
(1050 requests total, ~300ms delay apart, a few minutes to complete).
Output: **1000 records** in `data/books.jsonl`, one per book.

## A real gotcha, not a bug in this code

The site's own HTML repeats each book's description text twice back-to-back
and appends a leftover `"...more"` string (a "read more" UI artifact baked
into the static page source, not something JS adds). Confirmed this by
`curl`-ing the raw HTML directly — it's server-side, not a parsing mistake
on this scraper's part. The trailing `"...more"` is stripped in the clean
step since it's clearly not part of the actual description; the duplicated
sentence itself was left as-is since deduping it generically risked
corrupting descriptions that legitimately repeat a phrase.

## Not done

Only a single target site was scraped. No deduping/near-duplicate detection
across records, no incremental/resume support if the crawl is interrupted
partway through (it's a straight run each time via `npm start`).
