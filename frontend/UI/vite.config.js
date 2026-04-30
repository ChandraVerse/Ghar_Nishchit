import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load the Gemini API key from the Ai folder
  const aiEnv = loadEnv(mode, path.resolve(__dirname, '../../Ai'), '');

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(aiEnv.VITE_GEMINI_API_KEY)
    },
    server: {
      fs: {
        allow: ['../..']
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            firebase: ['firebase/app', 'firebase/auth'],
            motion: ['framer-motion'],
            icons: ['@heroicons/react', 'lucide-react', 'react-icons'],
            toast: ['react-toastify'],
          },
        },
      },
    },
  };
});
