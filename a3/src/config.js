module.exports = {
  BASE_URL: "https://books.toscrape.com",
  USER_AGENT: "A3ScraperHW/1.0 (+https://github.com/SercanOzkan55/FlyRankHW; contact: ozkansercan55@gmail.com)",
  REQUEST_DELAY_MS: 300,
  MAX_LISTING_PAGES: Number(process.env.MAX_LISTING_PAGES) || 50,
  OUTPUT_FILE: "data/books.jsonl",
};
