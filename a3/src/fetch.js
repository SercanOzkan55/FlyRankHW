const axios = require("axios");
const { USER_AGENT, REQUEST_DELAY_MS } = require("./config");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function politeGet(url) {
  await sleep(REQUEST_DELAY_MS);
  const response = await axios.get(url, {
    headers: { "User-Agent": USER_AGENT },
    timeout: 10000,
  });
  return response.data;
}

module.exports = { politeGet, sleep };
