// 历史记录条目
export interface HistoryEntry {
  id: string
  timestamp: number
  code: string
  errorCount: number
  warningCount: number
  passed: boolean
  preview: string // 代码预览（第一行）
}

const MAX_HISTORY = 20
const STORAGE_KEY = 'dockerfile-history'

// 获取历史记录
export function getHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore
  }
  return []
}

// 保存到历史记录
export function saveToHistory(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
  const history = getHistory()

  const newEntry: HistoryEntry = {
    ...entry,
    id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  }

  // 添加到开头
  history.unshift(newEntry)

  // 保持最多10条
  if (history.length > MAX_HISTORY) {
    history.pop()
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

// 删除历史记录
export function deleteHistoryEntry(id: string): void {
  const history = getHistory()
  const filtered = history.filter(h => h.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

// 清空历史记录
export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// 格式化时间
export function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

  return new Date(timestamp).toLocaleDateString()
}