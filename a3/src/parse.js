const cheerio = require("cheerio");

const RATING_WORDS = { One: 1, Two: 2, Three: 3, Four: 4, Five: 5 };

function extractListingPage(html, pageUrl) {
  const $ = cheerio.load(html);
  const items = [];

  $("article.product_pod").each((_, el) => {
    const $el = $(el);
    const relativeHref = $el.find("h3 a").attr("href");
    const detailUrl = new URL(relativeHref, pageUrl).toString();
    const title = $el.find("h3 a").attr("title");
    const rawPrice = $el.find(".product_price .price_color").text();
    const rawAvailability = $el.find(".instock.availability").text();
    const ratingClass = $el.find("p.star-rating").attr("class") || "";
    const ratingWord = ratingClass.replace("star-rating", "").trim();

    items.push({
      title,
      detailUrl,
      rawPrice,
      rawAvailability,
      rating: RATING_WORDS[ratingWord] ?? null,
    });
  });

  const hasNextPage = $("li.next a").length > 0;
  return { items, hasNextPage };
}

function extractDetailPage(html, detailUrl) {
  const $ = cheerio.load(html);

  const category = $("ul.breadcrumb li").eq(2).find("a").text().trim();
  const description = ($("#product_description").next("p").text().trim() || "")
    .replace(/\s*\.\.\.more\s*$/, "") || null;

  const tableInfo = {};
  $("table.table-striped tr").each((_, row) => {
    const key = $(row).find("th").text().trim();
    const value = $(row).find("td").text().trim();
    tableInfo[key] = value;
  });

  return {
    detailUrl,
    category: category || null,
    description,
    upc: tableInfo["UPC"] || null,
    rawPriceExclTax: tableInfo["Price (excl. tax)"] || null,
    rawPriceInclTax: tableInfo["Price (incl. tax)"] || null,
    rawTax: tableInfo["Tax"] || null,
    rawAvailabilityDetail: tableInfo["Availability"] || null,
    reviewCount: tableInfo["Number of reviews"] ? Number(tableInfo["Number of reviews"]) : null,
  };
}

module.exports = { extractListingPage, extractDetailPage };
