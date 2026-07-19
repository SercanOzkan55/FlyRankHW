# Smallest Possible Backend

A tiny Node.js server with two JSON endpoints.

## Run

```bash
npm start
```

Or without npm:

```bash
node server.js
```

## Endpoints

```bash
curl http://localhost:3000/
curl http://localhost:3000/time
```

- `GET /` returns a hello message.
- `GET /time` returns the current server time.
