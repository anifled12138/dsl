import { useMemo, useState, useEffect } from 'react'
import { PieChart } from '../components/charts/PieChart'
import { BarChart } from '../components/charts/BarChart'
import { ThemeToggle } from '../components/ThemeToggle'
import { TestCaseModal } from '../components/TestCaseModal'
import { EXAMPLES } from '../examples'
import { lintDockerfile } from '../linter'
import { getCustomTestCases, deleteCustomTestCase, clearCustomTestCases, saveCustomTestCase, CustomTestCase } from '../services/customTests'
import type { TestResult, TestReport } from '../types'
import { useTheme } from '../contexts/ThemeContext'

export function TestResultPage() {
  const { theme } = useTheme()
  console.debug('Theme:', theme) // 用于触发重新渲染
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all')
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null)
  const [useCustomOnly, setUseCustomOnly] = useState(false)
  const [customTests, setCustomTests] = useState<CustomTestCase[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // 加载自定义测试案例
  useEffect(() => {
    setCustomTests(getCustomTestCases())
  }, [])

  // 刷新自定义测试案例
  const refreshCustomTests = () => {
    setCustomTests(getCustomTestCases())
  }

  // 删除自定义测试案例
  const handleDeleteCustom = (id: string) => {
    if (confirm('确定要删除这个测试案例吗？')) {
      deleteCustomTestCase(id)
      refreshCustomTests()
    }
  }

  // 清空自定义测试案例
  const handleClearCustom = () => {
    if (confirm('确定要清空所有自定义测试案例吗？')) {
      clearCustomTestCases()
      refreshCustomTests()
    }
  }

  // 生成测试报告
  const report = useMemo<TestReport>(() => {
    // 根据选择使用内置案例或自定义案例
    const testCases = useCustomOnly && customTests.length > 0
      ? customTests.map(c => ({
          id: c.id,
          name: c.name,
          category: 'mixed' as const,
          description: c.description,
          content: c.content,
          expectedDiagnostics: c.expectedDiagnostics,
        }))
      : EXAMPLES

    const results: TestResult[] = testCases.map(example => {
      const diagnostics = lintDockerfile(example.content)
      const actualErrors = diagnostics.filter(d => d.severity === 'error').length
      const actualWarnings = diagnostics.filter(d => d.severity === 'warning').length
      const actualInfos = diagnostics.filter(d => d.severity === 'info').length

      const expectedMatch =
        actualErrors === example.expectedDiagnostics.errors &&
        actualWarnings === example.expectedDiagnostics.warnings &&
        actualInfos === example.expectedDiagnostics.infos

      return {
        exampleId: example.id,
        exampleName: example.name,
        category: example.category,
        passed: expectedMatch,
        input: example.content,
        expectedDiagnostics: example.expectedDiagnostics,
        actualDiagnostics: {
          errors: actualErrors,
          warnings: actualWarnings,
          infos: actualInfos,
        },
        diagnostics,
      }
    })

    const passedTests = results.filter(r => r.passed).length
    const failedTests = results.length - passedTests

    return {
      totalTests: results.length,
      passedTests,
      failedTests,
      passRate: Math.round((passedTests / results.length) * 100),
      errorCount: results.reduce((sum, r) => sum + r.actualDiagnostics.errors, 0),
      warningCount: results.reduce((sum, r) => sum + r.actualDiagnostics.warnings, 0),
      infoCount: results.reduce((sum, r) => sum + r.actualDiagnostics.infos, 0),
      results,
      runAt: new Date().toISOString(),
    }
  }, [useCustomOnly, customTests])

  const filteredResults = useMemo(() => {
    if (filter === 'all') return report.results
    return report.results.filter(r => filter === 'passed' ? r.passed : !r.passed)
  }, [report.results, filter])

  const pieData = [
    { label: '通过', value: report.passedTests, color: '#22c55e' },
    { label: '失败', value: report.failedTests, color: '#ef4444' },
  ]

  const diagnosticData = [
    { label: '错误', value: report.errorCount, color: '#ef4444' },
    { label: '警告', value: report.warningCount, color: '#f59e0b' },
    { label: '信息', value: report.infoCount, color: '#3b82f6' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 theme-transition">
      {/* 头部 */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-3 theme-transition shadow-sm">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="#/"
              className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回
            </a>
            <h1 className="text-xl font-bold text-gray-800 dark:text-slate-100">
              📊 测试报告
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 dark:text-slate-400">
              {report.totalTests} 个案例
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 主内容区 - 三列布局 */}
      <main className="flex h-[calc(100vh-60px)]">
        {/* 左侧：统计和图表 */}
        <div className="w-80 shrink-0 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 overflow-y-auto">
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{report.totalTests}</div>
              <div className="text-sm text-blue-500/70 dark:text-blue-400/70">总案例</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{report.passRate}%</div>
              <div className="text-sm text-green-500/70 dark:text-green-400/70">通过率</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{report.passedTests}</div>
              <div className="text-xs text-green-500/70">通过</div>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{report.failedTests}</div>
              <div className="text-xs text-red-500/70">失败</div>
            </div>
          </div>

          {/* 图表 */}
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-slate-300">测试结果</h3>
              <PieChart data={pieData} size={160} />
            </div>
            <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 text-gray-600 dark:text-slate-300">诊断统计</h3>
              <BarChart data={diagnosticData} height={120} />
            </div>
          </div>
        </div>

        {/* 中间：测试结果列表 */}
        <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
          {/* 工具栏 */}
          <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {/* 数据源切换 */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                <button
                  onClick={() => setUseCustomOnly(false)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    !useCustomOnly
                      ? 'bg-white dark:bg-slate-600 shadow text-gray-800 dark:text-white'
                      : 'text-gray-500 dark:text-slate-400'
                  }`}
                >
                  内置 ({EXAMPLES.length})
                </button>
                <button
                  onClick={() => setUseCustomOnly(true)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    useCustomOnly
                      ? 'bg-white dark:bg-slate-600 shadow text-gray-800 dark:text-white'
                      : 'text-gray-500 dark:text-slate-400'
                  }`}
                  disabled={customTests.length === 0}
                >
                  自定义 ({customTests.length})
                </button>
              </div>

              {/* 过滤器 */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFilter('passed')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    filter === 'passed'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  通过
                </button>
                <button
                  onClick={() => setFilter('failed')}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    filter === 'failed'
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  失败
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors"
            >
              ➕ 新建案例
            </button>
          </div>

          {/* 结果列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid gap-2">
              {filteredResults.map((result) => (
                <div
                  key={result.exampleId}
                  onClick={() => setSelectedResult(result)}
                  className={`
                    p-3 rounded-lg cursor-pointer transition-all duration-200
                    hover:shadow-md hover:-translate-y-0.5
                    ${result.passed
                      ? 'bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 border-l-4 border-green-500'
                      : 'bg-gradient-to-r from-red-50 to-transparent dark:from-red-900/20 border-l-4 border-red-500'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{result.passed ? '✅' : '❌'}</span>
                      <div>
                        <div className="font-medium text-sm">{result.exampleName}</div>
                        <div className="text-xs text-gray-500 dark:text-slate-400">
                          {result.category}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs">
                      <span className="text-red-500">{result.actualDiagnostics.errors}</span>/
                      <span className="text-yellow-500">{result.actualDiagnostics.warnings}</span>/
                      <span className="text-blue-500">{result.actualDiagnostics.infos}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：自定义案例管理 */}
        <div className="w-72 shrink-0 border-l border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between shrink-0">
            <h3 className="font-semibold text-gray-700 dark:text-slate-200 flex items-center gap-2">
              <span>📝</span>
              <span>自定义案例</span>
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 px-1.5 py-0.5 rounded text-purple-600 dark:text-purple-400">
                {customTests.length}
              </span>
            </h3>
            {customTests.length > 0 && (
              <button
                onClick={handleClearCustom}
                className="text-xs text-gray-400 hover:text-red-500"
                title="清空所有"
              >
                🗑️
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {customTests.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-slate-500 py-8">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-sm">暂无自定义案例</p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-3 text-xs text-purple-500 hover:text-purple-600"
                >
                  + 新建第一个案例
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {customTests.map((test, index) => (
                  <div
                    key={test.id}
                    className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10 border border-purple-100 dark:border-purple-800/30 hover:shadow-md transition-all duration-200 cursor-pointer"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-sm text-gray-700 dark:text-slate-200 line-clamp-1">
                        {test.name}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCustom(test.id); }}
                        className="text-gray-300 hover:text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 mb-2 line-clamp-2">
                      {test.description || '无描述'}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-red-500">🔴 {test.expectedDiagnostics.errors}</span>
                      <span className="text-yellow-500">🟡 {test.expectedDiagnostics.warnings}</span>
                      <span className="text-blue-500">ℹ️ {test.expectedDiagnostics.infos}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 详情弹窗 */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedResult(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedResult.exampleName}</h3>
              <button
                onClick={() => setSelectedResult(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-slate-400"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
              <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4 text-center">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 dark:text-slate-400">预期错误</div>
                    <div className="text-xl font-bold text-red-500">{selectedResult.expectedDiagnostics.errors}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 dark:text-slate-400">预期警告</div>
                    <div className="text-xl font-bold text-yellow-500">{selectedResult.expectedDiagnostics.warnings}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 dark:text-slate-400">预期信息</div>
                    <div className="text-xl font-bold text-blue-500">{selectedResult.expectedDiagnostics.infos}</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-medium mb-2 text-gray-700 dark:text-slate-200">输入内容:</h4>
                <pre className="bg-gray-100 dark:bg-slate-900 p-3 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap font-mono">
                  {selectedResult.input}
                </pre>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-700 dark:text-slate-200">诊断结果:</h4>
                {selectedResult.diagnostics.length === 0 ? (
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-green-600 dark:text-green-400">
                    ✅ 无诊断结果
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {selectedResult.diagnostics.map((d, i) => (
                      <li key={i} className="bg-gray-50 dark:bg-slate-700 p-2 rounded text-sm flex items-start gap-2">
                        <span>{d.severity === 'error' ? '🔴' : d.severity === 'warning' ? '🟡' : 'ℹ️'}</span>
                        <span>行 {d.line}: {d.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新建案例弹窗 */}
      <TestCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(name, desc, content, expected) => {
          saveCustomTestCase({ name, description: desc, content, expectedDiagnostics: expected })
          refreshCustomTests()
        }}
      />
    </div>
  )
}