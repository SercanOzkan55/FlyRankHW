const axios = require("axios");
const { BASE_URL, USER_AGENT } = require("./config");

async function checkRobotsAllowed() {
  try {
    const res = await axios.get(`${BASE_URL}/robots.txt`, {
      headers: { "User-Agent": USER_AGENT },
      validateStatus: () => true,
    });
    if (res.status === 404) {
      console.log("robots.txt: not published (404) — no crawl restrictions declared, proceeding politely.");
      return { disallow: [] };
    }
    const disallow = res.data
      .split("\n")
      .filter((line) => line.trim().toLowerCase().startsWith("disallow:"))
      .map((line) => line.split(":")[1].trim())
      .filter(Boolean);
    console.log("robots.txt disallow rules:", disallow);
    return { disallow };
  } catch (err) {
    console.warn("robots.txt check failed, aborting crawl to be safe:", err.message);
    throw err;
  }
}

function isAllowed(path, disallow) {
  return !disallow.some((rule) => path.startsWith(rule));
}

module.exports = { checkRobotsAllowed, isAllowed };
