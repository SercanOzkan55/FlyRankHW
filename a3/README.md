# A3 Scraper — books.toscrape.com

A polite scraper that crawls [books.toscrape.com](https://books.toscrape.com),
extracts book records, cleans them, and writes structured JSONL — following
a fetch → parse → extract → clean → structure pipeline.

## Why this site

`books.toscrape.com` is a sandbox built specifically for scraping practice.
It publishes no `robots.txt` (requesting it returns 404), so there are no
declared crawl restrictions — the scraper still checks for one and respects
it if present (see `src/robots.js`).

## Politeness measures

- **Identification:** every request sends a descriptive `User-Agent`
  (`A3ScraperHW/1.0 (+github link; contact email)`) instead of impersonating
  a browser.
- **Rate limiting:** a fixed delay (`REQUEST_DELAY_MS`, 300ms) between every
  single HTTP request — listing pages and detail pages alike.
- **robots.txt check:** run before any crawling starts; any `Disallow` rule
  found would be enforced via `isAllowed()` in `src/robots.js`.

## Pipeline

```
src/
  config.js    Base URL, user-agent, delay, output path
  fetch.js     politeGet() — rate-limited HTTP GET with a real User-Agent
  robots.js    Fetches and parses robots.txt, exposes isAllowed(path)
  parse.js     Cheerio-based extraction from listing pages and detail pages
  clean.js     Turns raw strings ("£51.77", "In stock (22 available)",
               "star-rating Three") into typed fields
  index.js     Orchestrates: crawl listing pages -> collect detail URLs ->
               fetch each detail page -> clean -> write JSONL
```

1. **Fetch** — walks `/catalogue/page-N.html` from 1 until there's no
   "next" link, then fetches every book's own detail page.
2. **Parse** — Cheerio loads each HTML response into a queryable DOM.
3. **Extract** — pulls title, price, rating, stock, UPC, category,
   description, and review count using selectors confirmed against the
   live site's markup.
4. **Clean** — `£51.77` → `{ price: 51.77, currency: "GBP" }`;
   `"In stock (22 available)"` → `{ inStock: true, stockCount: 22 }`;
   `star-rating Three` → `rating: 3`; strips the site's own `...more`
   read-more artifact from descriptions.
5. **Structure** — one JSON object per line in `data/books.jsonl`:

```json
{
  "id": "a897fe39b1053632",
  "title": "A Light in the Attic",
  "price": 51.77,
  "currency": "GBP",
  "rating": 3,
  "inStock": true,
  "stockCount": 22,
  "category": "Poetry",
  "description": "...",
  "reviewCount": 0,
  "url": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
  "scrapedAt": "2026-07-19T11:05:33.879Z"
}
```

## Running it

```bash
npm install
npm start
```

Full run crawls all 50 listing pages (~1000 books, ~1050 requests total at
300ms/request, a few minutes). For a quick smoke test, cap the crawl:

```bash
MAX_LISTING_PAGES=2 npm start
```

Output goes to `data/books.jsonl`.
