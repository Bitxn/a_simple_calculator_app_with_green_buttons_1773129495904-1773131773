import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    // ✅ Remove hardcoded port — let CLI --port flag control it
    strictPort: false,
    host: "0.0.0.0",
    proxy: {
      '/api': {
        target: 'http://localhost:8056',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})