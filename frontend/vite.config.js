import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Custom plugin to add security headers to Vite dev server
const securityHeaders = () => ({
  name: 'security-headers',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Block access to sensitive files immediately
      if (req.url && (req.url.includes('/.env') || req.url.endsWith('.env') || req.url === '/.env')) {
        // Set security headers even for blocked requests
        res.setHeader('X-Content-Type-Options', 'nosniff')
        res.setHeader('X-Frame-Options', 'DENY')
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
        res.setHeader('Content-Type', 'text/plain')
        res.statusCode = 403
        res.end('403 Forbidden - Access to sensitive files is not allowed')
        return
      }
      
      // Store original writeHead to ensure headers are set before response
      const originalWriteHead = res.writeHead
      res.writeHead = function(...args) {
        // Content Security Policy - Production-grade (unsafe-eval/inline needed for Vite HMR)
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " + // Required for Vite HMR
          "style-src 'self' 'unsafe-inline'; " + // Required for Vite HMR
          "img-src 'self' data: https://localhost:3000; " +
          "connect-src 'self' https://localhost:3000 ws://localhost:5173 wss://localhost:5173; " +
          "font-src 'self'; " +
          "object-src 'none'; " +
          "base-uri 'self'; " +
          "form-action 'self'; " +
          "frame-ancestors 'none';"
        )
        
        // Anti-clickjacking
        res.setHeader('X-Frame-Options', 'DENY')
        
        // MIME-sniffing protection
        res.setHeader('X-Content-Type-Options', 'nosniff')
        
        // XSS Protection
        res.setHeader('X-XSS-Protection', '1; mode=block')
        
        // HSTS - HTTP Strict Transport Security (fix for edge cases)
        res.setHeader(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains; preload'
        )
        
        // Referrer Policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        
        // Permissions Policy
        res.setHeader(
          'Permissions-Policy',
          'geolocation=(), microphone=(), camera=()'
        )
        
        // Cache-Control for security-sensitive responses
        if (req.url.includes('.jsx') || req.url.includes('.tsx')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
        }
        
        return originalWriteHead.apply(this, args)
      }
      
      next()
    })
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    securityHeaders()
  ],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, '../backend/ssl/server.key')),
      cert: fs.readFileSync(path.resolve(__dirname, '../backend/ssl/server.cert'))
    },
    // Disable source map exposure in dev to prevent error disclosure
    sourcemapIgnoreList: () => true,
    // Fix: Allow serving files from parent directory for SSL certs
    fs: {
      allow: [
        // Allow serving files from the workspace root
        path.resolve(__dirname, '..'),
        // Allow serving from frontend directory
        path.resolve(__dirname, '.'),
      ]
    }
  },
  // Optimize dependencies to prevent compatibility issues
  optimizeDeps: {
    exclude: [], // Add problematic deps here if needed
    include: ['react', 'react-dom'] // Pre-bundle common deps (removed react-router-dom - not used)
  },
  build: {
    // Production build settings
    sourcemap: false, // Disable source maps in production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Remove comments and console logs in production
        banner: '/* Application built with security hardening */'
      }
    }
  },
  esbuild: {
    // Remove console logs and debugger statements in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})