/**
 * Custom entry point for cPanel's Node.js Selector (Phusion Passenger).
 * Passenger requires the app itself to open an HTTP server on the port it
 * assigns via process.env.PORT — it does not run "npm start" or any
 * package.json script, it just requires() this file directly. Not used by
 * the Docker Compose deployment (which uses `next start` instead).
 */
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`> MEF Organizasyon ready on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Next.js app failed to start:", err);
    process.exit(1);
  });
