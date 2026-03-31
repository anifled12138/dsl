export type Severity = 'error' | 'warning' | 'info' | 'security'
export type Confidence = 'high' | 'medium' | 'low'
export type Category = 'syntax' | 'security' | 'best-practice' | 'semantic'

export interface Diagnostic {
  line: number
  column: number
  message: string
  severity: Severity
  // 扩展字段
  id?: string                   // 规则编号，如 R002
  title?: string                // 问题标题
  suggestion?: string           // 修复建议
  confidence?: Confidence       // 置信度
  category?: Category           // 规则类别
  instruction?: string          // 对应指令
  stage?: string                // 所属阶段别名
  stageIndex?: number           // 阶段索引
  lineEnd?: number              // 多行指令结束行（用于高亮范围）
}

// 规则元数据
export interface RuleMeta {
  id: string
  name: string
  description: string
  category: Category
  severity: Severity
  confidence: Confidence
  appliesTo: string[]
  rationale: string
  examples: {
    bad: string
    good: string
  }
}

export interface TestResult {
  exampleId: string
  exampleName: string
  category: string
  passed: boolean
  input: string
  expectedDiagnostics: { errors: number; warnings: number; infos: number }
  actualDiagnostics: { errors: number; warnings: number; infos: number }
  diagnostics: Diagnostic[]
}

export interface TestReport {
  totalTests: number
  passedTests: number
  failedTests: number
  passRate: number
  errorCount: number
  warningCount: number
  infoCount: number
  results: TestResult[]
  runAt: string
}

export type AIProvider = 'anthropic' | 'openai'

export interface AISettings {
  provider: AIProvider
  apiKey: string
  baseUrl?: string
  model?: string
}

export interface FixSuggestion {
  originalLine: string
  suggestedFix: string
  explanation: string
}