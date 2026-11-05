import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"


// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Local etms-api (NestJS gateway) for VITE_API_BASE=/legacy; see src/services/http/apiClient.js
  const etmsApiUrl = loadEnv(mode, process.cwd(), '').ETMS_API_URL || 'http://localhost:3000';

  return {
  base:'./',
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
    },
  },
  server: {
    // Playwright writes traces/screenshots here; watching them reloads pages mid-test.
    watch: { ignored: ['**/e2e/.results/**'] },
    proxy: {
      // etms-api: native routes first, or the legacy '/api' rule below would match them.
      '^/api/v1/': { target: etmsApiUrl, changeOrigin: true },
      '/legacy': { target: etmsApiUrl, changeOrigin: true },
      '/dataPushApi': {
        target: 'https://etmsonline.in/Demo/datapush/api/v1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/dataPushApi/, ''),
      },
      '/api': {
        target: 'https://www.etmsonline.in/etmsApi',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/etmsApi': {
        target: 'https://www.etmsonline.in/demo/datapush/api/v1',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/etmsApi/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/etmsApiMap': {
        target: 'https://etmsonline.in',
        changeOrigin: true,
        secure: false,
         rewrite: (path) => path.replace(/^\/etmsApiMap/, '/etmsApi'), // Rewrite to actual endpoint
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/heatmapApi': {
        target: 'https://etmsonline.in/etmsApi',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/heatmapApi/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        }
      },
     
    },
  },
};
});
