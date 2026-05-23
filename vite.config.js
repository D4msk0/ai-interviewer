import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY || ''}`,
          },
        },
      },
    },
  }
})
