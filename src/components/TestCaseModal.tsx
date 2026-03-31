import { useState, useEffect } from 'react'
import { lintDockerfile } from '../linter'

interface TestCaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, description: string, content: string, expected: { errors: number; warnings: number; infos: number }) => void
  initialData?: {
    name: string
    description: string
    content: string
  }
  title?: string
}

export function TestCaseModal({ isOpen, onClose, onSave, initialData, title = '新建测试案例' }: TestCaseModalProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [detected, setDetected] = useState({ errors: 0, warnings: 0, infos: 0 })
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
    if (initialData) {
      setName(initialData.name)
      setDescription(initialData.description)
      setContent(initialData.content)
    } else {
      setName('')
      setDescription('')
      setContent('')
    }
  }, [initialData, isOpen])

  useEffect(() => {
    if (content) {
      const diags = lintDockerfile(content)
      setDetected({
        errors: diags.filter(d => d.severity === 'error').length,
        warnings: diags.filter(d => d.severity === 'warning').length,
        infos: diags.filter(d => d.severity === 'info').length,
      })
    } else {
      setDetected({ errors: 0, warnings: 0, infos: 0 })
    }
  }, [content])

  if (!isVisible) return null

  const handleSave = () => {
    if (name.trim() && content.trim()) {
      onSave(name.trim(), description.trim(), content, detected)
      onClose()
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 dark:bg-black/70 backdrop-blur-md p-4 transition-opacity duration-300 ${isScale ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
    >
      <div
        className={`w-[560px] bg-white dark:bg-[#141414] border border-transparent dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-transform duration-300 ${isScale ? 'scale-100' : 'scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
          {/* 案例名称 */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
              案例名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="例如：基础 Node.js 应用"
              className="w-full h-10 px-4 rounded-lg bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
              描述
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="简短描述这个测试案例"
              className="w-full h-10 px-4 rounded-lg bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* Dockerfile 内容 */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dockerfile 内容 *
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="输入 Dockerfile 代码..."
              rows={10}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono resize-none"
            />
          </div>

          {/* 自动检测预期结果 */}
          <div className="bg-gray-50 dark:bg-[#0A0A0A] rounded-lg p-4 border border-gray-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                自动检测预期结果
              </span>
              <span className="text-[12px] text-gray-500 dark:text-gray-400">
                基于当前代码自动计算
              </span>
            </div>
            <div className="flex items-center gap-4 text-[13px]">
              <span className="text-red-600 dark:text-red-400">
                {detected.errors} 错误
              </span>
              <span className="text-yellow-600 dark:text-yellow-400">
                {detected.warnings} 警告
              </span>
              <span className="text-blue-600 dark:text-blue-400">
                {detected.infos} 信息
              </span>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-[#141414] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-9 px-4 text-[13px] font-medium rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:bg-transparent dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !content.trim()}
            className="h-9 px-4 text-[13px] font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            保存案例
          </button>
        </div>
      </div>
    </div>
  )
}