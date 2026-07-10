const http = require("http");

const PORT = process.env.PORT || 3000;

const sendJson = (res, status, data) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    return sendJson(res, 200, { message: "Hello from the smallest backend" });
  }

  if (req.url === "/time") {
    return sendJson(res, 200, { now: new Date().toISOString() });
  }

  return sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
