import { useState, useCallback, useRef, useEffect } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { Layout } from './components/Layout'
import { Header } from './components/Header'
import { CodeEditor, CodeEditorRef, Diagnostic } from './components/CodeEditor'
import { ErrorPanel } from './components/ErrorPanel'
import { HistoryPanel } from './components/HistoryPanel'
import { ApiKeyModal } from './components/ApiKeyModal'
import { TestCaseModal } from './components/TestCaseModal'
import { ExampleLibrary } from './components/ExampleLibrary'
import { TestResultPage } from './pages/TestResultPage'
import { lintDockerfile } from './linter'
import { getAISettingsFromStorage, saveAISettingsToStorage } from './services/aiFix'
import { saveToHistory, HistoryEntry } from './services/history'
import { saveCustomTestCase } from './services/customTests'
import type { AIProvider } from './types'

const DEFAULT_DOCKERFILE = `# 示例 Dockerfile
FROM ubuntu:20.04

WORKDIR /app

COPY . .

RUN apt-get update && apt-get install -y nodejs

CMD ["node", "index.js"]
`

function AppContent() {
  // 路由状态
  const [currentPage, setCurrentPage] = useState<'main' | 'test'>('main')

  // 主页面状态
  const [code, setCode] = useState(DEFAULT_DOCKERFILE)
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)
  const isLoadingHistoryRef = useRef(false) // 用 ref 标记是否正在加载历史记录，不触发重新渲染
  const editorRef = useRef<CodeEditorRef>(null)

  // API 设置状态
  const [isApiModalOpen, setIsApiModalOpen] = useState(false)
  const [apiSettings, setApiSettings] = useState<{ provider: AIProvider; apiKey: string; baseUrl?: string; model?: string } | null>(null)

  // 测试案例弹窗
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false)

  // 示例库弹窗
  const [isExampleLibraryOpen, setIsExampleLibraryOpen] = useState(false)

  // 初始化时从 sessionStorage 加载 API 设置
  useEffect(() => {
    const stored = getAISettingsFromStorage()
    if (stored) {
      setApiSettings(stored)
    }
  }, [])

  // 监听 hash 变化
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      setCurrentPage(hash === '#/test' ? 'test' : 'main')
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // 校验函数（带防抖）- 代码变化时自动校验
  useEffect(() => {
    const timer = setTimeout(() => {
      const results = lintDockerfile(code)
      setDiagnostics(results)
    }, 150) // 150ms防抖，确保粘贴等操作能完成

    return () => clearTimeout(timer)
  }, [code])

  // 保存历史记录（只在用户主动编辑代码时保存）
  useEffect(() => {
    const timer = setTimeout(() => {
      // 如果正在加载历史记录，跳过保存并重置标记
      if (isLoadingHistoryRef.current) {
        isLoadingHistoryRef.current = false
        return
      }

      if (code.trim()) {
        const errorCount = diagnostics.filter(d => d.severity === 'error').length
        const warningCount = diagnostics.filter(d => d.severity === 'warning').length
        // 获取前三行有效代码作为预览
        const codeLines = code.split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).slice(0, 3)
        const preview = codeLines.map(l => l.trim()).join('\n')

        saveToHistory({
          code,
          errorCount,
          warningCount,
          passed: errorCount === 0,
          preview,
        })
        setHistoryRefreshKey(k => k + 1)
      }
    }, 1000) // 1秒后保存，避免太频繁

    return () => clearTimeout(timer)
  }, [code, diagnostics]) // 不依赖 loadingHistoryCode，避免状态变化触发

  // 点击错误跳转
  const handleErrorClick = useCallback((line: number, lineEnd?: number, severity?: 'error' | 'warning' | 'info' | 'security') => {
    editorRef.current?.goToLine(line, lineEnd, severity)
  }, [])

  // 新建测试案例
  const handleCreateTestCase = useCallback(() => {
    setIsTestCaseModalOpen(true)
  }, [])

  // 保存测试案例
  const handleSaveTestCase = useCallback((name: string, description: string, content: string, expected: { errors: number; warnings: number; infos: number }) => {
    saveCustomTestCase({
      name,
      description,
      content,
      expectedDiagnostics: expected,
    })
  }, [])

  // API 设置保存
  const handleSaveApiSettings = useCallback((provider: AIProvider, apiKey: string, baseUrl?: string, model?: string) => {
    const settings = { provider, apiKey, baseUrl, model }
    setApiSettings(settings)
    saveAISettingsToStorage(settings)
  }, [])

  // 应用修复
  const handleApplyFix = useCallback((line: number, fix: string) => {
    const lines = code.split('\n')
    if (line > 0 && line <= lines.length) {
      lines[line - 1] = fix
      setCode(lines.join('\n'))
    }
  }, [code])

  // 选择历史记录
  const handleSelectHistory = useCallback((entry: HistoryEntry) => {
    isLoadingHistoryRef.current = true // 标记正在加载历史记录
    setCode(entry.code)
  }, [])

  // 测试结果页面
  if (currentPage === 'test') {
    return <TestResultPage />
  }

  // 主页面
  return (
    <>
      <Layout
        header={
          <Header
            onOpenExampleLibrary={() => setIsExampleLibraryOpen(true)}
            onCreateTestCase={handleCreateTestCase}
            onOpenApiSettings={() => setIsApiModalOpen(true)}
          />
        }
        editor={
          <CodeEditor
            ref={editorRef}
            value={code}
            onChange={setCode}
            diagnostics={diagnostics}
          />
        }
        panel={
          <ErrorPanel
            diagnostics={diagnostics}
            dockerfile={code}
            onErrorClick={handleErrorClick}
            onApplyFix={handleApplyFix}
            onOpenApiSettings={() => setIsApiModalOpen(true)}
          />
        }
        history={
          <HistoryPanel onSelectHistory={handleSelectHistory} refreshKey={historyRefreshKey} />
        }
      />
      <ApiKeyModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        onSave={handleSaveApiSettings}
        currentSettings={apiSettings}
      />
      <TestCaseModal
        isOpen={isTestCaseModalOpen}
        onClose={() => setIsTestCaseModalOpen(false)}
        onSave={handleSaveTestCase}
        initialData={{ name: '', description: '', content: code }}
      />
      <ExampleLibrary
        isOpen={isExampleLibraryOpen}
        onClose={() => setIsExampleLibraryOpen(false)}
        onSelectExample={setCode}
      />
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App