import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).send("Missing URL parameter");
    }

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
          'Referer': new URL(targetUrl).origin + '/'
        }
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType) {
        res.setHeader('Content-Type', contentType);
      }
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (targetUrl.split('?')[0].endsWith('.m3u8') || (contentType && contentType.includes('mpegurl'))) {
        let body = await response.text();
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        
        body = body.split('\n').map(line => {
          if (line.trim() && !line.startsWith('#')) {
            const isAbsolute = line.startsWith('http://') || line.startsWith('https://');
            if (!isAbsolute) {
              return new URL(line, baseUrl).href;
            }
          }
          if (line.startsWith('#') && line.includes('URI="')) {
            return line.replace(/URI="([^"]+)"/, (match, p1) => {
              const isAbsolute = p1.startsWith('http://') || p1.startsWith('https://');
              if (!isAbsolute) {
                return `URI="${new URL(p1, baseUrl).href}"`;
              }
              return match;
            });
          }
          return line;
        }).join('\n');
        
        res.send(body);
      } else {
        const body = await response.arrayBuffer();
        res.send(Buffer.from(body));
      }

    } catch (error) {
      console.error('/api/proxy error:', error);
      res.status(500).send("Proxy error");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

