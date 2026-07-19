function parsePrice(raw) {
  if (!raw) return { amount: null, currency: null };
  const match = raw.trim().match(/^([^\d.,]+)?\s*([\d.,]+)/);
  if (!match) return { amount: null, currency: null };
  const symbol = (match[1] || "").trim();
  const currency = symbol === "£" ? "GBP" : symbol === "$" ? "USD" : symbol === "€" ? "EUR" : symbol || null;
  return { amount: Number(match[2].replace(",", "")), currency };
}

function parseAvailability(raw) {
  if (!raw) return { inStock: false, stockCount: null };
  const clean = raw.replace(/\s+/g, " ").trim();
  const inStock = /in stock/i.test(clean);
  const countMatch = clean.match(/\((\d+)\s+available\)/i);
  return { inStock, stockCount: countMatch ? Number(countMatch[1]) : null };
}

function buildRecord(listItem, detail, scrapedAt) {
  const price = parsePrice(listItem.rawPrice);
  const availability = parseAvailability(detail.rawAvailabilityDetail || listItem.rawAvailability);

  return {
    id: detail.upc,
    title: listItem.title.trim(),
    price: price.amount,
    currency: price.currency,
    rating: listItem.rating,
    inStock: availability.inStock,
    stockCount: availability.stockCount,
    category: detail.category,
    description: detail.description,
    reviewCount: detail.reviewCount,
    url: listItem.detailUrl,
    scrapedAt,
  };
}

module.exports = { parsePrice, parseAvailability, buildRecord };
