const fs = require("fs");
const path = require("path");
const { BASE_URL, MAX_LISTING_PAGES, OUTPUT_FILE } = require("./config");
const { politeGet } = require("./fetch");
const { checkRobotsAllowed, isAllowed } = require("./robots");
const { extractListingPage, extractDetailPage } = require("./parse");
const { buildRecord } = require("./clean");

async function main() {
  const { disallow } = await checkRobotsAllowed();

  const listItems = [];
  for (let page = 1; page <= MAX_LISTING_PAGES; page++) {
    const pagePath = `/catalogue/page-${page}.html`;
    if (!isAllowed(pagePath, disallow)) {
      console.log(`Skipping disallowed path: ${pagePath}`);
      continue;
    }
    const pageUrl = `${BASE_URL}${pagePath}`;
    console.log(`Fetching listing page ${page}...`);
    const html = await politeGet(pageUrl);
    const { items, hasNextPage } = extractListingPage(html, pageUrl);
    listItems.push(...items);
    if (!hasNextPage) {
      console.log(`No next page after page ${page}, stopping listing crawl.`);
      break;
    }
  }
  console.log(`Collected ${listItems.length} book links from listing pages.`);

  const outputPath = path.join(__dirname, "..", OUTPUT_FILE);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const stream = fs.createWriteStream(outputPath, { flags: "w" });

  let count = 0;
  for (const item of listItems) {
    const detailPath = new URL(item.detailUrl).pathname;
    if (!isAllowed(detailPath, disallow)) {
      console.log(`Skipping disallowed detail path: ${detailPath}`);
      continue;
    }
    const html = await politeGet(item.detailUrl);
    const detail = extractDetailPage(html, item.detailUrl);
    const record = buildRecord(item, detail, new Date().toISOString());
    stream.write(JSON.stringify(record) + "\n");
    count++;
    if (count % 50 === 0) console.log(`Scraped ${count}/${listItems.length} books...`);
  }

  stream.end();
  console.log(`Done. Wrote ${count} records to ${OUTPUT_FILE}`);
}

main().catch((err) => {
  console.error("Scraper failed:", err);
  process.exit(1);
});
