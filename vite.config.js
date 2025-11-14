import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base:'./',
  plugins: [react()],
  server: {
    proxy: {
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
});
 
