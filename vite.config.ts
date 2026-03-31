import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'http'

// 动态代理中间件
function dynamicProxyMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    // 只处理 /proxy/ 路径的请求
    if (!req.url?.startsWith('/proxy/')) {
      return next()
    }

    try {
      // 从请求头获取目标地址
      const targetOrigin = req.headers['x-proxy-origin'] as string
      const targetHost = req.headers['x-proxy-host'] as string

      if (!targetOrigin) {
        res.statusCode = 400
        res.end(JSON.stringify({ error: 'Missing proxy target' }))
        return
      }

      // 构建目标URL
      const targetUrl = targetOrigin + req.url.replace('/proxy', '')
      console.log('[Proxy] Forwarding to:', targetUrl)

      // 收集请求体
      const chunks: Buffer[] = []
      for await (const chunk of req) {
        chunks.push(chunk)
      }
      const body = Buffer.concat(chunks).toString()

      // 转发请求
      const fetchResponse = await fetch(targetUrl, {
        method: req.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers['authorization'] as string,
        },
        body: body || undefined,
      })

      // 返回响应
      const responseBody = await fetchResponse.text()
      res.statusCode = fetchResponse.status
      res.setHeader('Content-Type', 'application/json')
      res.end(responseBody)
    } catch (error) {
      console.error('[Proxy] Error:', error)
      res.statusCode = 500
      res.end(JSON.stringify({ error: 'Proxy error', message: String(error) }))
    }
  }
}

// GitHub Pages 部署配置
// 如果仓库名不是 'dsl'，请修改下面的 base 路径
// 例如：仓库名是 'my-validator'，则 base 应为 '/my-validator/'
const repoName = 'dsl'

export default defineConfig({
  // GitHub Pages 需要设置 base 路径
  base: process.env.GITHUB_PAGES ? `/${repoName}/` : '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'dynamic-proxy',
      configureServer(server) {
        server.middlewares.use(dynamicProxyMiddleware())
      },
    },
  ],
  server: {
    // 预配置的静态代理（用于内置API）
    proxy: {
      '/api': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/openai/, ''),
      },
    },
  },
})