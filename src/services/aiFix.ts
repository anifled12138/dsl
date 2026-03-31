import type { AIProvider, Diagnostic, FixSuggestion } from '../types'

interface AISettings {
  provider: AIProvider
  apiKey: string
  baseUrl?: string
  model?: string
}

export class AIFixError extends Error {
  constructor(message: string, public code: 'cors' | 'network' | 'api' | 'unknown') {
    super(message)
    this.name = 'AIFixError'
  }
}

export async function getAIFix(
  settings: AISettings,
  dockerfile: string,
  diagnostic: Diagnostic
): Promise<FixSuggestion | null> {
  const prompt = buildPrompt(dockerfile, diagnostic)

  try {
    if (settings.baseUrl) {
      // 自定义端点 - 使用Vite代理
      return await callCustomAPI(settings.baseUrl, settings.apiKey, prompt, settings.model)
    } else if (settings.provider === 'anthropic') {
      return await callAnthropic(settings.apiKey, prompt, settings.model)
    } else {
      return await callOpenAI(settings.apiKey, prompt, settings.model)
    }
  } catch (error) {
    console.error('AI fix error:', error)

    // 检测错误类型
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new AIFixError(
        '网络请求失败。请检查网络连接。',
        'network'
      )
    }

    if (error instanceof AIFixError) {
      throw error
    }

    throw new AIFixError(
      error instanceof Error ? error.message : '未知错误',
      'unknown'
    )
  }
}

function buildPrompt(dockerfile: string, diagnostic: Diagnostic): string {
  const lines = dockerfile.split('\n')
  const errorLine = lines[diagnostic.line - 1] || ''

  return `你是一个 Dockerfile 专家。用户遇到了一个 Dockerfile 错误，请帮助修复。

## Dockerfile 内容:
\`\`\`dockerfile
${dockerfile}
\`\`\`

## 错误信息:
- 行号: ${diagnostic.line}
- 列号: ${diagnostic.column}
- 严重程度: ${diagnostic.severity}
- 消息: ${diagnostic.message}

## 错误行内容:
\`\`\`
${errorLine}
\`\`\`

请提供修复建议，以 JSON 格式返回（不要包含 markdown 代码块）:
{
  "originalLine": "原始行内容",
  "suggestedFix": "修复后的行内容",
  "explanation": "修复说明（中文，简短）"
}`
}

async function callAnthropic(apiKey: string, prompt: string, model?: string): Promise<FixSuggestion> {
  // 使用本地Vite代理，绕过CORS
  const response = await fetch('/api/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new AIFixError(
      error.error?.message || `Anthropic API 错误: ${response.status}`,
      'api'
    )
  }

  const data = await response.json()
  const content = data.content[0]?.text || ''

  return parseAIResponse(content)
}

async function callOpenAI(apiKey: string, prompt: string, model?: string): Promise<FixSuggestion> {
  // 使用本地Vite代理，绕过CORS
  const response = await fetch('/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-3.5-turbo',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new AIFixError(
      error.error?.message || `OpenAI API 错误: ${response.status}`,
      'api'
    )
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || ''

  return parseAIResponse(content)
}

async function callCustomAPI(baseUrl: string, apiKey: string, prompt: string, model?: string): Promise<FixSuggestion> {
  // 确保URL正确
  let url = baseUrl.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  // 解析URL
  let urlObj: URL
  try {
    urlObj = new URL(url)
  } catch {
    throw new AIFixError('API 地址格式无效，请检查输入', 'api')
  }

  // 使用用户指定的模型，或默认模型
  const finalModel = model || 'gpt-3.5-turbo'

  // 构建请求体
  const requestBody = {
    model: finalModel,
    max_tokens: 1024,
    messages: [
      { role: 'user', content: prompt },
    ],
  }

  // 使用动态代理（通过 /proxy/ 路径 + 自定义请求头）
  const response = await fetch('/proxy/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Proxy-Origin': urlObj.origin,
      'X-Proxy-Host': urlObj.host,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const errorMsg = error.error?.message || error.message || `API 错误: ${response.status}`

    if (response.status === 401) {
      throw new AIFixError('API Key 无效，请检查是否正确', 'api')
    }
    if (response.status === 404) {
      throw new AIFixError('API 地址无效，请检查格式', 'api')
    }

    throw new AIFixError(errorMsg, 'api')
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || data.output?.text || ''

  return parseAIResponse(content)
}

function parseAIResponse(content: string): FixSuggestion {
  // 尝试提取 JSON
  try {
    // 移除可能的 markdown 代码块
    let jsonStr = content
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '')
    }

    const parsed = JSON.parse(jsonStr.trim())
    return {
      originalLine: parsed.originalLine || '',
      suggestedFix: parsed.suggestedFix || '',
      explanation: parsed.explanation || 'AI 未能提供修复说明',
    }
  } catch {
    // 如果 JSON 解析失败，返回原始内容作为说明
    return {
      originalLine: '',
      suggestedFix: '',
      explanation: content.trim(),
    }
  }
}

// 从 sessionStorage 获取设置
export function getAISettingsFromStorage(): { provider: AIProvider; apiKey: string; baseUrl?: string; model?: string } | null {
  try {
    const stored = sessionStorage.getItem('ai-settings')
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore
  }
  return null
}

// 保存设置到 sessionStorage
export function saveAISettingsToStorage(settings: { provider: AIProvider; apiKey: string; baseUrl?: string; model?: string }): void {
  sessionStorage.setItem('ai-settings', JSON.stringify(settings))
}

// 清除设置
export function clearAISettingsFromStorage(): void {
  sessionStorage.removeItem('ai-settings')
}