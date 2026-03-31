import { useState, useEffect, useCallback } from 'react'
import { getHistory, deleteHistoryEntry, clearHistory, formatTime, HistoryEntry } from '../services/history'

interface HistoryPanelProps {
  onSelectHistory: (entry: HistoryEntry) => void
  refreshKey?: number
}

export function HistoryPanel({ onSelectHistory, refreshKey }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    setHistory(getHistory())
  }, [refreshKey])

  const refreshHistory = useCallback(() => {
    setHistory(getHistory())
  }, [])

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteHistoryEntry(id)
    refreshHistory()
  }

  const handleClearAll = () => {
    if (confirm('确定要清空所有历史记录吗？')) {
      clearHistory()
      refreshHistory()
    }
  }

  const handleClick = (entry: HistoryEntry) => {
    setSelectedId(entry.id)
    onSelectHistory(entry)
  }

  if (history.length === 0) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-[#141414]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#1A1A1A]">
          <h2 className="text-[14px] font-medium text-gray-900 dark:text-white">历史记录</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500 p-8 bg-gray-50/50 dark:bg-[#0A0A0A]">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10"></div>
            </div>
            <p className="text-[14px] font-medium text-gray-600 dark:text-gray-300">暂无历史记录</p>
            <p className="text-[13px] mt-1 text-gray-400 dark:text-gray-500">编辑代码后自动保存</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#141414]">
      {/* 头部 */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#1A1A1A]">
        <h2 className="text-[15px] font-medium text-gray-900 dark:text-white">历史记录</h2>
        <button
          onClick={handleClearAll}
          className="text-[13px] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          清空
        </button>
      </div>

      {/* 历史卡片列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-6 flex flex-col gap-[12px] bg-gray-50/50 dark:bg-[#0A0A0A]">
        {history.map((entry) => (
          <div
            key={entry.id}
            onClick={() => handleClick(entry)}
            className={`px-5 py-3 rounded-xl shadow-sm cursor-pointer relative transition-all group ${
              selectedId === entry.id
                ? 'bg-white dark:bg-[#1A1A1A] ring-1 ring-blue-500 dark:ring-blue-500/50 border border-transparent'
                : 'bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-white/5 hover:shadow-md'
            }`}
          >
            {/* 状态和时间 */}
            <div className="flex justify-between items-center mb-2">
              <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold ${
                entry.passed
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${entry.passed ? 'bg-green-500' : 'bg-red-500'}`} />
                {entry.passed ? '校验通过' : '校验失败'}
              </span>
              <span className="text-[12px] text-gray-400 font-mono">
                {formatTime(entry.timestamp)}
              </span>
            </div>

            {/* 代码预览 */}
            <div className="bg-gray-50 dark:bg-[#050505] border border-gray-100 dark:border-white/5 rounded-md px-3 py-2">
              <pre className="text-[13px] font-mono text-gray-500 dark:text-gray-400 whitespace-pre-wrap line-clamp-4 leading-relaxed">
                {entry.preview || '(空)'}
              </pre>
            </div>

            {/* 统计信息 */}
            <div className="flex gap-3 text-[12px] font-medium mt-2">
              {entry.errorCount > 0 && (
                <span className="text-red-600 dark:text-red-400">
                  {entry.errorCount} 错误
                </span>
              )}
              {entry.warningCount > 0 && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  {entry.warningCount} 警告
                </span>
              )}
              {entry.errorCount === 0 && entry.warningCount === 0 && (
                <span className="text-green-600 dark:text-green-400">
                  无问题
                </span>
              )}
            </div>

            {/* 删除按钮 */}
            <button
              onClick={(e) => handleDelete(entry.id, e)}
              className="absolute top-3 right-3 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors text-[13px] opacity-0 group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}