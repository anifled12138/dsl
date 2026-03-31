import { useState } from 'react'
import type { Diagnostic, RuleMeta } from '../types'
import { allRules } from '../linter/rules'

interface IssueDetailPanelProps {
  diagnostic: Diagnostic | null
  onClose: () => void
  onApplySuggestion?: (line: number, suggestion: string) => void
}

// 从规则库获取规则元数据
function getRuleMeta(ruleId: string): RuleMeta | null {
  const rule = allRules.find(r => r.meta.id === ruleId)
  return rule ? rule.meta : null
}

// 复制到剪贴板
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  }
}

// 严重级别配置
const severityConfig = {
  error: {
    icon: 'error',
    label: '错误',
    textColor: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-500/10',
    barColor: 'bg-red-500',
  },
  warning: {
    icon: 'warning',
    label: '警告',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-500/10',
    barColor: 'bg-yellow-400',
  },
  info: {
    icon: 'info',
    label: '信息',
    textColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-500/10',
    barColor: 'bg-blue-400',
  },
  security: {
    icon: 'security',
    label: '安全',
    textColor: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-500/10',
    barColor: 'bg-orange-500',
  },
}

export function IssueDetailPanel({ diagnostic, onClose, onApplySuggestion }: IssueDetailPanelProps) {
  const [copied, setCopied] = useState<string | null>(null)

  if (!diagnostic) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 bg-white dark:bg-[#141414]">
        <div className="text-center p-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-[14px]">点击问题查看详情</p>
        </div>
      </div>
    )
  }

  const ruleMeta = diagnostic.id ? getRuleMeta(diagnostic.id) : null
  const sevConfig = severityConfig[diagnostic.severity] || severityConfig.info

  const handleCopy = async (text: string, key: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#141414]">
      {/* 头部 */}
      <div className="flex items-center justify-between px-7 py-6 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
            {diagnostic.title || '问题详情'}
          </h2>
        </div>
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
      <div className="flex-1 overflow-y-auto px-7 pb-7 pt-7 flex flex-col gap-[16px]">
        {/* 标签行 */}
        <div className="flex flex-wrap items-center gap-3 py-5">
          {diagnostic.id && (
            <span className="text-[12px] font-semibold px-2 py-0.5 rounded text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400">
              {diagnostic.id}
            </span>
          )}
          <span className={`text-[12px] font-semibold px-2 py-0.5 rounded ${sevConfig.textColor} ${sevConfig.bgColor}`}>
            {sevConfig.label}
          </span>
        </div>

        {/* 位置信息 */}
        <div className="text-[14px] text-gray-500 dark:text-gray-400">
          📍 行 {diagnostic.line}{diagnostic.column ? `:${diagnostic.column}` : ''}
          {diagnostic.instruction && (
            <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-white/5 rounded text-[12px] font-mono">
              {diagnostic.instruction}
            </span>
          )}
          {diagnostic.stage && (
            <span className="ml-2 text-[13px]">
              阶段: {diagnostic.stage}
            </span>
          )}
        </div>

        {/* 问题描述 */}
        <div className="p-4 bg-gray-50 dark:bg-[#0A0A0A] rounded-lg border border-gray-100 dark:border-white/5">
          <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">
            {diagnostic.message}
          </p>
        </div>

        {/* 修复建议 */}
        {diagnostic.suggestion && (
          <div className="space-y-3">
            <h4 className="text-[14px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-3">
              💡 修复建议
            </h4>
            <div className="p-4 bg-green-50 dark:bg-green-500/5 rounded-lg border border-green-100 dark:border-green-500/10">
              <p className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">{diagnostic.suggestion}</p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => handleCopy(diagnostic.suggestion!, 'suggestion')}
                  className="text-[13px] px-3 py-1.5 rounded-md bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20 transition-colors"
                >
                  {copied === 'suggestion' ? '已复制' : '复制'}
                </button>
                {onApplySuggestion && (
                  <button
                    onClick={() => onApplySuggestion(diagnostic.line, diagnostic.suggestion!)}
                    className="text-[13px] px-3 py-1.5 rounded-md bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-colors"
                  >
                    应用
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 规则详情 */}
        {ruleMeta && (
          <>
            {/* 规则依据 */}
            <div className="space-y-3">
              <h4 className="text-[14px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-3">
                📖 为什么存在此规则
              </h4>
              <p className="text-[14px] text-gray-600 dark:text-gray-400 leading-relaxed p-4 bg-gray-50 dark:bg-[#0A0A0A] rounded-lg border border-gray-100 dark:border-white/5">
                {ruleMeta.rationale}
              </p>
            </div>

            {/* 代码示例 */}
            <div className="space-y-3">
              <h4 className="text-[14px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-3">
                📝 代码示例
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {/* 反例 */}
                <div>
                  <div className="text-[12px] text-red-500 dark:text-red-400 mb-2 font-medium">❌ 反例</div>
                  <pre className="text-[13px] bg-red-50 dark:bg-red-500/5 p-4 rounded-lg border border-red-100 dark:border-red-500/10 overflow-x-auto font-mono text-red-700 dark:text-red-400">
                    {ruleMeta.examples.bad}
                  </pre>
                  <button
                    onClick={() => handleCopy(ruleMeta.examples.bad, 'bad')}
                    className="mt-2 text-[12px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {copied === 'bad' ? '已复制' : '复制'}
                  </button>
                </div>
                {/* 正例 */}
                <div>
                  <div className="text-[12px] text-green-500 dark:text-green-400 mb-2 font-medium">✅ 正例</div>
                  <pre className="text-[13px] bg-green-50 dark:bg-green-500/5 p-4 rounded-lg border border-green-100 dark:border-green-500/10 overflow-x-auto font-mono text-green-700 dark:text-green-400">
                    {ruleMeta.examples.good}
                  </pre>
                  <button
                    onClick={() => handleCopy(ruleMeta.examples.good, 'good')}
                    className="mt-2 text-[12px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {copied === 'good' ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
            </div>

            {/* 适用指令 */}
            <div className="text-[13px] text-gray-500 dark:text-gray-400 pt-2">
              适用指令: {ruleMeta.appliesTo.join(', ')}
            </div>
          </>
        )}
      </div>
    </div>
  )
}