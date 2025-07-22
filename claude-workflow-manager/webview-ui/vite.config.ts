import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../out/webview-ui',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    },
    // Optimize for VSCode webview environment
    minify: 'terser',
    sourcemap: false,
    target: 'es2020'
  },
  // Configure for VSCode webview context
  base: '',
  server: {
    port: 3000,
    host: 'localhost',
    cors: true
  },
  define: {
    // Ensure we're in webview context
    'process.env.VSCODE_WEBVIEW': 'true'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    }
  },
  // Optimize dependencies for webview
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react'],
    exclude: ['@vscode/webview-ui-toolkit']
  }
})