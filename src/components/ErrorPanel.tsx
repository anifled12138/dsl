import { useState, useMemo } from 'react'
import type { Diagnostic, FixSuggestion, Severity, Category } from '../types'
import { getAIFix, getAISettingsFromStorage, AIFixError } from '../services/aiFix'
import { IssueDetailPanel } from './IssueDetailPanel'
import { exportToJson, exportToMarkdown } from '../services/export'

// 复制到剪贴板的辅助函数
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

// 过滤器状态
interface FilterState {
  severity: Set<Severity>
  category: Set<Category>
  search: string
}

interface ErrorPanelProps {
  diagnostics: Diagnostic[]
  dockerfile: string
  onErrorClick: (line: number, lineEnd?: number, severity?: Severity) => void
  onApplyFix: (line: number, fix: string) => void
  onOpenApiSettings: () => void
}

export function ErrorPanel({ diagnostics, dockerfile, onErrorClick, onApplyFix, onOpenApiSettings }: ErrorPanelProps) {
  const [loadingLine, setLoadingLine] = useState<number | null>(null)
  const [fixSuggestions, setFixSuggestions] = useState<Record<number, FixSuggestion>>({})
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [copiedLine, setCopiedLine] = useState<number | null>(null)
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<Diagnostic | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    severity: new Set(['error', 'warning', 'security', 'info']),
    category: new Set(['syntax', 'security', 'best-practice', 'semantic']),
    search: '',
  })

  // 过滤后的诊断结果
  const filteredDiagnostics = useMemo(() => {
    return diagnostics.filter(d => {
      if (!filters.severity.has(d.severity)) return false
      if (d.category && !filters.category.has(d.category)) return false
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchMessage = d.message.toLowerCase().includes(searchLower)
        const matchId = d.id?.toLowerCase().includes(searchLower)
        const matchTitle = d.title?.toLowerCase().includes(searchLower)
        if (!matchMessage && !matchId && !matchTitle) return false
      }
      return true
    })
  }, [diagnostics, filters])

  // 统计
  const errorCount = diagnostics.filter(d => d.severity === 'error').length
  const warningCount = diagnostics.filter(d => d.severity === 'warning').length
  const securityCount = diagnostics.filter(d => d.severity === 'security').length
  const hasErrors = errorCount > 0 || securityCount > 0

  const severityConfig = {
    error: {
      dotColor: 'bg-red-500',
      textColor: 'text-red-700 dark:text-red-400',
      bgColor: 'bg-red-50/50 dark:bg-red-500/5',
      borderColor: 'border-red-100/50 dark:border-red-500/10',
      hoverBg: 'hover:bg-red-50 dark:hover:bg-red-500/10',
      barColor: 'bg-red-500',
    },
    security: {
      dotColor: 'bg-orange-500',
      textColor: 'text-orange-700 dark:text-orange-400',
      bgColor: 'bg-orange-50/50 dark:bg-orange-500/5',
      borderColor: 'border-orange-100/50 dark:border-orange-500/10',
      hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-500/10',
      barColor: 'bg-orange-500',
    },
    warning: {
      dotColor: 'bg-yellow-400',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      bgColor: 'bg-yellow-50/50 dark:bg-yellow-500/5',
      borderColor: 'border-yellow-100/50 dark:border-yellow-500/10',
      hoverBg: 'hover:bg-yellow-50 dark:hover:bg-yellow-500/10',
      barColor: 'bg-yellow-400',
    },
    info: {
      dotColor: 'bg-blue-400',
      textColor: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50/50 dark:bg-blue-500/5',
      borderColor: 'border-blue-100/50 dark:border-blue-500/10',
      hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
      barColor: 'bg-blue-400',
    },
  }

  const categoryConfig = {
    syntax: { label: '语法' },
    security: { label: '安全' },
    'best-practice': { label: '最佳实践' },
    semantic: { label: '语义' },
  }

  const toggleSeverity = (sev: Severity) => {
    setFilters(prev => {
      const newSet = new Set(prev.severity)
      if (newSet.has(sev)) {
        newSet.delete(sev)
      } else {
        newSet.add(sev)
      }
      return { ...prev, severity: newSet }
    })
  }

  const toggleCategory = (cat: Category) => {
    setFilters(prev => {
      const newSet = new Set(prev.category)
      if (newSet.has(cat)) {
        newSet.delete(cat)
      } else {
        newSet.add(cat)
      }
      return { ...prev, category: newSet }
    })
  }

  const handleAIFix = async (diag: Diagnostic) => {
    const settings = getAISettingsFromStorage()
    if (!settings) {
      onOpenApiSettings()
      return
    }
    setLoadingLine(diag.line)
    setError(null)
    try {
      const suggestion = await getAIFix(settings, dockerfile, diag)
      if (suggestion) {
        setFixSuggestions(prev => ({ ...prev, [diag.line]: suggestion }))
      }
    } catch (err) {
      if (err instanceof AIFixError) {
        setError({ message: err.message, code: err.code })
      } else {
        setError({ message: err instanceof Error ? err.message : 'AI 修复失败' })
      }
    } finally {
      setLoadingLine(null)
    }
  }

  const handleApplyFix = (diag: Diagnostic, suggestion: FixSuggestion) => {
    if (suggestion.suggestedFix) {
      onApplyFix(diag.line, suggestion.suggestedFix)
      setFixSuggestions(prev => {
        const next = { ...prev }
        delete next[diag.line]
        return next
      })
    }
  }

  const handleCopyFix = async (line: number, text: string) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopiedLine(line)
      setTimeout(() => setCopiedLine(null), 2000)
    }
  }

  const handleDiagnosticClick = (diag: Diagnostic) => {
    onErrorClick(diag.line, diag.lineEnd, diag.severity)
    // 始终显示详情面板
    setSelectedDiagnostic(diag)
  }

  // 一键应用所有修复
  const handleApplyAllFixes = () => {
    Object.entries(fixSuggestions).forEach(([line, suggestion]) => {
      if (suggestion.suggestedFix) {
        onApplyFix(parseInt(line), suggestion.suggestedFix)
      }
    })
    setFixSuggestions({})
  }

  if (selectedDiagnostic) {
    return (
      <IssueDetailPanel
        diagnostic={selectedDiagnostic}
        onClose={() => setSelectedDiagnostic(null)}
        onApplySuggestion={(line, suggestion) => {
          onApplyFix(line, suggestion)
          setSelectedDiagnostic(null)
        }}
      />
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#141414] transition-colors">
      {/* 头部大状态区域 */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#141414] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-5">
          {/* 状态图标 */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            hasErrors
              ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400'
          }`}>
            {hasErrors ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          {/* 状态文字 */}
          <div className="ml-1">
            <h2 className="text-[18px] font-semibold text-gray-900 dark:text-white tracking-tight">
              {hasErrors ? '校验未通过' : '校验通过'}
            </h2>
            <p className="text-[14px] text-gray-500 dark:text-gray-400 mt-1">
              {hasErrors
                ? `发现 ${errorCount} 个错误，${warningCount} 个警告，请修复后构建`
                : '代码符合规范，可以安全构建'}
            </p>
          </div>
        </div>
        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="h-8 min-w-[56px] px-3 text-[13px] font-medium rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-all"
          >
            过滤
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="h-8 min-w-[56px] px-3 text-[13px] font-medium rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-all"
            >
              导出
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/10 rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                <button
                  onClick={() => {
                    exportToJson(dockerfile, diagnostics, { includeCode: true, includeSuggestions: true })
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  JSON 格式
                </button>
                <button
                  onClick={() => {
                    exportToMarkdown(dockerfile, diagnostics, { includeCode: true, includeSuggestions: true })
                    setShowExportMenu(false)
                  }}
                  className="w-full text-left px-4 py-2 text-[13px] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  Markdown 格式
                </button>
              </div>
            )}
          </div>
          {Object.keys(fixSuggestions).length > 0 && (
            <button
              onClick={handleApplyAllFixes}
              className="h-8 min-w-[120px] px-4 text-[13px] font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-sm transition-all"
            >
              一键应用修复
            </button>
          )}
        </div>
      </div>

      {/* 过滤器面板 */}
      {showFilters && (
        <div className="px-8 py-4 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#141414]">
          <input
            type="text"
            placeholder="搜索问题..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full h-10 px-4 text-[13px] rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0A0A0A] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <div className="flex items-center gap-3 flex-wrap mt-4">
            <span className="text-[13px] text-gray-500 dark:text-gray-400">类别:</span>
            {(Object.keys(categoryConfig) as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1 text-[13px] rounded-lg transition-colors ${
                  filters.category.has(cat)
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {categoryConfig[cat].label}
              </button>
            ))}
          </div>
          <div className="text-[13px] text-gray-500 dark:text-gray-400 mt-3">
            显示 {filteredDiagnostics.length} / {diagnostics.length} 条结果
          </div>
        </div>
      )}

      {/* 四个严重级别卡片 */}
      <div className="px-8 py-5 flex gap-4 shrink-0">
        {(['error', 'security', 'warning', 'info'] as Severity[]).map(sev => {
          const config = severityConfig[sev]
          const count = diagnostics.filter(d => d.severity === sev).length
          const isActive = filters.severity.has(sev)
          const labels = { error: '错误', security: '安全', warning: '警告', info: '提示' }

          return (
            <button
              key={sev}
              onClick={() => toggleSeverity(sev)}
              className={`flex-1 h-11 py-2 px-4 rounded-lg text-[15px] font-medium flex items-center justify-between transition-all border ${
                isActive
                  ? `${config.bgColor} ${config.borderColor} ${config.textColor} ${config.hoverBg}`
                  : 'bg-gray-50 dark:bg-white/[0.02] border-transparent text-gray-400 dark:text-gray-500'
              }`}
            >
              <span className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isActive ? config.dotColor : 'bg-gray-300 dark:bg-gray-600'}`} />
                {labels[sev]}
              </span>
              <span className="text-[14px] font-mono font-semibold">{count}</span>
            </button>
          )
        })}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-8 py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[13px] border-b border-red-100 dark:border-red-500/20">
          <div className="flex items-start gap-3">
            <span>⚠️</span>
            <div className="flex-1">
              <div className="font-medium mb-1">
                {error.code === 'cors' ? 'CORS 跨域限制' : error.code === 'network' ? '网络连接失败' : error.code === 'api' ? 'API 错误' : '错误'}
              </div>
              <div className="whitespace-pre-line text-xs opacity-80">{error.message}</div>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 dark:text-red-500">✕</button>
          </div>
        </div>
      )}

      {/* 诊断列表 */}
      {filteredDiagnostics.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50/30 dark:bg-[#0A0A0A]">
          <div className="text-center px-10 py-8">
            {diagnostics.length === 0 ? (
              <>
                <div className="text-5xl mb-4">✓</div>
                <p className="text-lg font-medium text-green-600 dark:text-green-400">校验通过</p>
                <p className="text-[14px] mt-2 text-gray-400 dark:text-gray-500">没有发现任何问题</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">无匹配结果</p>
                <p className="text-[14px] mt-2 text-gray-400 dark:text-gray-500">尝试调整过滤条件</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-8 pb-6 pt-6 flex flex-col gap-[16px] bg-gray-50/30 dark:bg-[#0A0A0A]">
          {filteredDiagnostics.map((diag, index) => {
            const config = severityConfig[diag.severity] || severityConfig.info
            const suggestion = fixSuggestions[diag.line]
            const isLoading = loadingLine === diag.line

            return (
              <div
                key={index}
                className="p-4 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/5 rounded-xl transition-all relative group cursor-pointer hover:shadow-md"
                onClick={() => handleDiagnosticClick(diag)}
              >
                {/* 左侧颜色条 */}
                <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${config.barColor}`} />

                {/* 头部：行号 + ID */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${config.textColor} ${config.bgColor}`}>
                      行 {diag.line}
                    </span>
                    {diag.id && (
                      <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500">
                        {diag.id}
                      </span>
                    )}
                  </div>
                </div>

                {/* 标题 */}
                {diag.title && (
                  <h3 className="text-[14px] font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                    {diag.title}
                  </h3>
                )}

                {/* 描述 */}
                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                  {diag.message}
                </p>

                {/* AI 修复区域 */}
                {diag.severity === 'error' && (
                  <div className="mt-2">
                    {!suggestion ? (
                      <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3 border border-gray-100 dark:border-white/5 flex items-center justify-between gap-3">
                        <div className="text-[13px] text-gray-700 dark:text-gray-300 font-mono">
                          {isLoading ? '正在获取修复建议...' : '点击获取 AI 修复建议'}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAIFix(diag) }}
                          disabled={isLoading}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                            isLoading
                              ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-wait'
                              : 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20'
                          }`}
                        >
                          {isLoading ? '思考中' : '应用'}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-[#111] rounded-lg p-3 border border-gray-100 dark:border-white/5">
                        <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-3">💡 修复建议</p>

                        {/* 原始/修复对比 */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-500 mb-1">原始代码:</div>
                            <pre className="text-[13px] bg-red-50/50 dark:bg-red-500/5 p-2 rounded border border-red-100 dark:border-red-500/10 overflow-x-auto font-mono text-red-700 dark:text-red-400">
                              {suggestion.originalLine || '(空)'}
                            </pre>
                          </div>
                          <div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-500 mb-1">修复后代码:</div>
                            <pre className="text-[13px] bg-green-50/50 dark:bg-green-500/5 p-2 rounded border border-green-100 dark:border-green-500/10 overflow-x-auto font-mono text-green-700 dark:text-green-400">
                              {suggestion.suggestedFix || '(无建议)'}
                            </pre>
                          </div>
                        </div>

                        <p className="text-[13px] text-gray-600 dark:text-gray-400 mb-3">{suggestion.explanation}</p>

                        {suggestion.suggestedFix && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleApplyFix(diag, suggestion) }}
                              className="px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-xs font-medium rounded-md transition-colors"
                            >
                              应用
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopyFix(diag.line, suggestion.suggestedFix) }}
                              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                copiedLine === diag.line
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                              }`}
                            >
                              {copiedLine === diag.line ? '已复制' : '复制'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}