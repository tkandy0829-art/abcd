
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Gemini SDK가 요구하는 process.env.API_KEY 형식을 지원하기 위해 정의
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY || process.env.API_KEY)
  },
  server: {
    port: 3000
  }
});
