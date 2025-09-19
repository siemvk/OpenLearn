/*
  _    _              _        _______   _   _   _   _ 
 | |  | |     /\     | |      |__   __| | | | | | | | |
 | |__| |    /  \    | |         | |    | | | | | | | |
 |  __  |   / /\ \   | |         | |    | | | | | | | |
 | |  | |  / ____ \  | |____     | |    |_| |_| |_| |_|
 |_|  |_| /_/    \_\ |______|    |_|    (_) (_) (_) (_)
*/

// POLARLEARN SERVER
// Dit bestand start PolarLearn zelf, wijzig niet tenzij je ECHT weet wat je doet!!!
// Enige wijziging kan heel PolarLearn breken, dus wees super voorzichtig!
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { serve } from "@hono/node-server";
import { honoApp, injectWebSocket } from "./hono-server";
import httpProxy from "http-proxy";
import { prisma } from "./utils/prisma";

const port = parseInt(process.env.PORT || "3000", 10);
const honoPort = parseInt(process.env.HONO_PORT || "3001", 10);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, turbopack: true });
const handle = app.getRequestHandler();

async function ensureTTLIndexes() {
  try {
    console.log("🔍 | Checking TTL indexes...");

    const collections = [
      { name: 'User', field: 'scheduledDeletion' },
      { name: 'practice', field: 'scheduledDeletion' },
      { name: 'forum', field: 'scheduledDeletion' },
      { name: 'group', field: 'scheduledDeletion' },
      { name: 'map', field: 'scheduledDeletion' }
    ];

    for (const { name, field } of collections) {
      try {
        const listIndexesResult = await prisma.$runCommandRaw({
          listIndexes: name
        });

        const indexes = (listIndexesResult as any).cursor?.firstBatch || [];

        const ttlIndexExists = indexes.some((index: any) =>
          index.key && index.key[field] === 1 && typeof index.expireAfterSeconds === 'number'
        );

        if (!ttlIndexExists) {
          await prisma.$runCommandRaw({
            createIndexes: name,
            indexes: [
              {
                key: { [field]: 1 },
                name: `${field}_ttl`,
                expireAfterSeconds: 0
              }
            ]
          });
          console.log(`✅ | Created TTL index for ${name}.${field}`);
        }
      } catch (error) {
        console.error(`❌ | Failed to create TTL index for ${name}.${field}:`, error);
      }
    }

    console.log("✅ | TTL index setup complete");
  } catch (error) {
    console.error("❌ | Error setting up TTL indexes:", error);
  }
}

app.prepare().then(() => {
  const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    ws: true,
  });

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);

    if (req.url === "/api/v1/ws") {
      req.url = req.url.replace("/api/v1/ws", "/ws");
      proxy.web(req, res, { target: `http://localhost:${honoPort}` });
    } else {
      handle(req, res, parsedUrl);
    }
  });

  server.on("upgrade", (req, socket, head) => {
    if (req.url === "/api/v1/ws") {
      req.url = req.url.replace("/api/v1/ws", "/ws");
      proxy.ws(req, socket, head, { target: `ws://localhost:${honoPort}` });
    }
  });

  server.listen(port, () => {
    console.log(`🟢 | Next.js running on http://localhost:${port}`);
  });

  const honoServer = serve({
    fetch: honoApp.fetch,
    port: honoPort,
  });

  injectWebSocket(honoServer);

  console.log(`🔥 | Hono server running on http://localhost:${honoPort}`);

  // Run TTL index check after servers are started
  setTimeout(() => {
    ensureTTLIndexes().catch(error => {
      console.error("❌ | TTL index setup failed:", error);
    });
  }, 1000);
});