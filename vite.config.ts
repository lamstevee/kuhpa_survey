import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { writeFileSync, mkdirSync } from "node:fs";

// dev 서버(`npm run dev`)에서만 동작한다. `npm run build`/`vite preview`에는
// 이 미들웨어가 없어 POST가 404가 되고, 클라이언트는 이를 조용히 무시한다
// (= localStorage에만 남는다). 의도된 동작 — 배포하지 않는 로컬 전용 도구다.
function saveResponses(): Plugin {
  return {
    name: "kuhpa-save-responses",
    configureServer(server) {
      server.middlewares.use("/api/save", (req, res, next) => {
        if (req.method !== "POST") return next();
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
          if (body.length > 1_000_000) {
            res.statusCode = 413;
            res.end();
            req.destroy();
          }
        });
        req.on("end", () => {
          try {
            const data = JSON.parse(body);
            // code는 클라이언트가 보낸 값이므로 경로 조작 방지를 위해 새니타이즈한다.
            const code = String(data.code ?? "").replace(/[^A-Za-z0-9]/g, "").slice(0, 12) || "NOCODE";
            mkdirSync("responses", { recursive: true });
            const file = `responses/${Date.now()}_${code}.json`;
            // ponytail: 같은 밀리초 + 같은 코드가 겹치면 500. 실제로 부딪히면
            // 파일명에 crypto.randomUUID()를 덧붙이는 것으로 충분하다.
            writeFileSync(file, JSON.stringify(data, null, 2), { flag: "wx" });
            console.log(`[save] ${file}`);
            res.statusCode = 204;
          } catch (e) {
            console.error("[save] 실패:", e);
            res.statusCode = 500;
          }
          res.end();
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), saveResponses()],
  // 설문 앱(index.html)과 단디 프로토타입(dandi.html) 두 진입점.
  build: {
    rollupOptions: {
      input: { main: "index.html", dandi: "dandi.html" },
    },
  },
  server: {
    port: 5180,
    open: true,
  },
});
