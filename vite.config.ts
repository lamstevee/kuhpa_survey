import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 강의용 데모: 원본의 SSO 복호화 미들웨어는 제거했습니다.
// (외부 인증 없이 랜딩 → 검사 → 결과만 동작합니다.)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    open: true,
  },
});
