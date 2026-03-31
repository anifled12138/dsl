// ============================================
// ExampleLibrary - 示例库组件
// ============================================

import { useState, useEffect, useRef } from 'react'
import { EXAMPLES, type Example } from '../examples'

interface ExampleLibraryProps {
  isOpen: boolean
  onClose: () => void
  onSelectExample: (content: string) => void
}

type ExampleCategory = 'all' | 'correct' | 'error' | 'warning' | 'mixed'

const categoryConfig: Record<ExampleCategory, { label: string }> = {
  all: { label: '全部' },
  correct: { label: '正确示例' },
  error: { label: '错误示例' },
  warning: { label: '警告示例' },
  mixed: { label: '混合示例' },
}

// 技术栈分类
const techCategories = [
  { id: 'node', label: 'Node.js', keywords: ['node', 'npm', 'nodejs'] },
  { id: 'python', label: 'Python', keywords: ['python', 'pip'] },
  { id: 'nginx', label: 'Nginx', keywords: ['nginx'] },
  { id: 'java', label: 'Java', keywords: ['java', 'spring', 'temurin'] },
  { id: 'go', label: 'Go', keywords: ['golang', 'go'] },
]

export function ExampleLibrary({ isOpen, onClose, onSelectExample }: ExampleLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<ExampleCategory>('all')
  const [selectedTech, setSelectedTech] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredExample, setHoveredExample] = useState<Example | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isScale, setIsScale] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // 点击外部关闭
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // ESC 关闭
  useEffect(() => {
    function handleEsc(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  // 过滤示例
  const filteredExamples = EXAMPLES.filter(example => {
    if (selectedCategory !== 'all' && example.category !== selectedCategory) {
      return false
    }

    if (selectedTech) {
      const tech = techCategories.find(t => t.id === selectedTech)
      if (tech) {
        const matchesTech = tech.keywords.some(kw =>
          example.content.toLowerCase().includes(kw) ||
          example.name.toLowerCase().includes(kw)
        )
        if (!matchesTech) return false
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = example.name.toLowerCase().includes(query)
      const matchesDesc = example.description.toLowerCase().includes(query)
      const matchesContent = example.content.toLowerCase().includes(query)
      if (!matchesName && !matchesDesc && !matchesContent) return false
    }

    return true
  })

  const handleSelect = (example: Example) => {
    onSelectExample(example.content)
    onClose()
  }

  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 dark:bg-black/70 backdrop-blur-md p-4 transition-opacity duration-300 ${isScale ? 'opacity-100' : 'opacity-0'}`}>
      <div
        ref={menuRef}
        className={`w-[860px] h-[680px] bg-white dark:bg-[#141414] border border-transparent dark:border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-transform duration-300 ${isScale ? 'scale-100' : 'scale-95'}`}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-7 py-6 border-b border-gray-100 dark:border-white/5 shrink-0">
          <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">官方示例库</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 过滤器 */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-white/5 flex flex-wrap gap-2 items-center bg-gray-50/50 dark:bg-[#0A0A0A]">
          {(Object.keys(categoryConfig) as ExampleCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {categoryConfig[cat].label}
            </button>
          ))}

          <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />

          {techCategories.map(tech => (
            <button
              key={tech.id}
              onClick={() => setSelectedTech(selectedTech === tech.id ? null : tech.id)}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
                selectedTech === tech.id
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tech.label}
            </button>
          ))}

          <div className="flex-1" />

          <input
            type="text"
            placeholder="搜索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-[140px] h-8 px-3 text-[13px] rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        {/* 示例列表 */}
        <div className="flex-1 overflow-y-auto p-7 bg-gray-50/50 dark:bg-[#0A0A0A]">
          {filteredExamples.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <span className="text-4xl mb-4 block">🔍</span>
              <p>未找到匹配的示例</p>
              <p className="text-[13px] mt-3">尝试调整过滤条件</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-[12px]">
              {filteredExamples.map(example => (
                <div
                  key={example.id}
                  onClick={() => handleSelect(example)}
                  onMouseEnter={() => setHoveredExample(example)}
                  onMouseLeave={() => setHoveredExample(null)}
                  className="px-6 rounded-xl bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/5 cursor-pointer group hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3 gap-3 py-5">
                    <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {example.name}
                    </h3>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                      example.category === 'correct'
                        ? 'text-green-600 bg-green-50 dark:bg-green-500/10 dark:text-green-400'
                        : example.category === 'error'
                          ? 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400'
                          : example.category === 'warning'
                            ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 dark:text-yellow-400'
                            : 'text-gray-600 bg-gray-50 dark:bg-white/5 dark:text-gray-400'
                    }`}>
                      {example.category === 'correct' ? '最佳实践' : example.category === 'error' ? '错误案例' : example.category === 'warning' ? '警告案例' : '混合'}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed pb-5">
                    {example.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 预览面板 */}
        <div className="h-[260px] shrink-0 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A] flex flex-col relative overflow-hidden">
          <div className="h-10 px-6 bg-gray-50 dark:bg-black border-b border-gray-200 dark:border-white/5 flex items-center justify-between shrink-0">
            <span className="text-[13px] font-mono text-gray-500 dark:text-gray-500">
              {hoveredExample ? `预览: ${hoveredExample.name}` : '等待预览...'}
            </span>
            {hoveredExample && (
              <button
                onClick={() => handleSelect(hoveredExample)}
                className="text-[13px] text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors px-3 py-1.5"
              >
                应用此模板
              </button>
            )}
          </div>
          <div className="flex-1 px-7 py-6 overflow-y-auto relative">
            {!hoveredExample ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500 pointer-events-none">
                <p className="text-[14px]">悬停卡片查看代码详情</p>
              </div>
            ) : (
              <pre className="text-[14px] font-mono text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {hoveredExample.content}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 导出辅助函数
export { EXAMPLES, type Example }