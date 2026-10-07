// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import fs from "node:fs/promises";
import path from "node:path";

export default defineConfig({
  // Vercel needs Nitro's Vercel adapter rather than the Cloudflare default.
  nitro: { preset: "vercel" },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      {
        name: "api-upload-middleware",
        configureServer(server) {
          server.middlewares.use("/api/upload", async (req, res) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end("Method Not Allowed");
              return;
            }

            try {
              const chunks: Buffer[] = [];
              for await (const chunk of req) {
                chunks.push(chunk as Buffer);
              }
              const body = Buffer.concat(chunks);
              const json = JSON.parse(body.toString("utf-8"));

              if (!json.base64) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Missing base64 data" }));
                return;
              }

              const filename = json.filename || `upload-${Date.now()}.png`;
              const base64Data = json.base64.replace(/^data:[^;]+;base64,/, "");
              const buffer = Buffer.from(base64Data, "base64");

              const uploadsDir = path.resolve(process.cwd(), "public/uploads");
              await fs.mkdir(uploadsDir, { recursive: true });

              const ext = path.extname(filename) || ".png";
              const cleanBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
              const safeName = `${cleanBase}_${Date.now()}${ext}`;
              const destPath = path.join(uploadsDir, safeName);

              await fs.writeFile(destPath, buffer);

              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(JSON.stringify({ url: `/uploads/${safeName}`, success: true }));
            } catch (err: unknown) {
              const error = err instanceof Error ? err.message : "Upload failed";
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error }));
            }
          });
        },
      },
    ],
  },
});
