import { useState, useEffect } from 'react'
import type { AIProvider } from '../types'

interface ApiKeyModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (provider: AIProvider, apiKey: string, baseUrl?: string, model?: string) => void
  currentSettings?: { provider: AIProvider; apiKey: string; baseUrl?: string; model?: string } | null
}

// 默认模型配置
const DEFAULT_MODELS: Record<AIProvider | 'custom', string> = {
  anthropic: 'claude-3-haiku-20240307',
  openai: 'gpt-3.5-turbo',
  custom: 'qwen-max',
}

export function ApiKeyModal({ isOpen, onClose, onSave, currentSettings }: ApiKeyModalProps) {
  const [provider, setProvider] = useState<AIProvider | 'custom'>(currentSettings?.provider || 'custom')
  const [apiKey, setApiKey] = useState(currentSettings?.apiKey || '')
  const [baseUrl, setBaseUrl] = useState(currentSettings?.baseUrl || '')
  const [model, setModel] = useState(currentSettings?.model || '')
  const [isVisible, setIsVisible] = useState(false)
  const [isScale, setIsScale] = useState(false)

  // 动画效果
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      setTimeout(() => {
        setIsScale(true)
      }, 10)
    } else {
      setIsScale(false)
      setTimeout(() => {
        setIsVisible(false)
      }, 300)
    }
  }, [isOpen])

  useEffect(() => {
    if (currentSettings) {
      setProvider(currentSettings.provider)
      setApiKey(currentSettings.apiKey)
      setBaseUrl(currentSettings.baseUrl || '')
      setModel(currentSettings.model || '')
    } else {
      setModel('')
    }
  }, [currentSettings])

  useEffect(() => {
    if (!model || model === DEFAULT_MODELS[provider]) {
      setModel(DEFAULT_MODELS[provider])
    }
  }, [provider])

  if (!isVisible) return null

  const handleSave = () => {
    if (apiKey.trim()) {
      const finalModel = model.trim() || DEFAULT_MODELS[provider]
      if (provider === 'custom') {
        onSave('anthropic', apiKey.trim(), baseUrl.trim() || undefined, finalModel)
      } else {
        onSave(provider, apiKey.trim(), baseUrl.trim() || undefined, finalModel)
      }
      onClose()
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 dark:bg-black/70 backdrop-blur-md p-4 transition-opacity duration-300 ${isScale ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div
        className={`w-[480px] bg-white dark:bg-[#141414] border border-transparent dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-transform duration-300 ${isScale ? 'scale-100' : 'scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ================= 头部 ================= */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">API 配置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ================= 内容区 ================= */}
        <div className="p-6 space-y-6">
          
          {/* 1. 选项卡 (三个页面切换器) */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
              AI 提供商
            </label>
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-[#0A0A0A] rounded-lg border border-transparent dark:border-white/5">
              {(['custom', 'anthropic', 'openai'] as const).map((prov) => (
                <button
                  key={prov}
                  onClick={() => { setProvider(prov); setBaseUrl(''); }}
                  className={`flex-1 py-1.5 text-[13px] font-medium rounded-md transition-all duration-200 ${
                    provider === prov
                      ? 'bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-white/5'
                      : 'text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                >
                  {prov === 'custom' ? '自定义' : prov === 'anthropic' ? 'Claude' : 'OpenAI'}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 动态表单区域 */}
          <div className="space-y-5">
            {/* 仅在“自定义”页面显示的 API 地址 */}
            {provider === 'custom' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API 地址
                </label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  placeholder="例如: https://dashscope.aliyuncs.com/compatible-mode/v1"
                  className="w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600"
                />
              </div>
            )}

            {/* 模型名称 (文本输入) */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                模型名称
              </label>
              <input
                type="text"
                value={model}
                onChange={e => setModel(e.target.value)}
                placeholder={DEFAULT_MODELS[provider]}
                className="w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
            </div>

            {/* API Key (密码输入) */}
            <div>
              <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full h-10 px-3 rounded-lg bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono placeholder:text-gray-400 dark:placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* 3. 安全说明 */}
          <div className="flex items-start gap-2.5 text-gray-500 dark:text-gray-400 pt-1">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <p className="text-[12px] leading-relaxed">
              <span className="font-medium text-gray-700 dark:text-gray-300">本地安全：</span>您的配置仅在浏览器本地进行处理。刷新或关闭页面后数据将自动销毁，绝不会上传至任何云端服务器。
            </p>
          </div>
        </div>

        {/* ================= 底部按钮 ================= */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#141414] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-8 px-4 text-[13px] font-medium rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:bg-transparent dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="h-8 px-4 text-[13px] font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  )
}