// ============================================
// Dockerfile Linter - 主入口
// ============================================

import { Diagnostic } from '../components/CodeEditor'
import {
  DockerfileAST,
  LintIssue,
} from './types'
import { parseDockerfile } from './parser'
import { deduplicateIssues } from './deduplication'
import { runAllRules } from './rules'

// 将 LintIssue 转换为 Diagnostic
function issueToDiagnostic(issue: LintIssue): Diagnostic {
  const severityMap: Record<string, 'error' | 'warning' | 'info' | 'security'> = {
    error: 'error',
    warning: 'warning',
    security: 'security',
    info: 'info',
  }

  return {
    line: issue.line,
    column: issue.column ?? 1, // 默认值为 1
    message: issue.message,
    severity: severityMap[issue.severity] || 'warning',
    // 扩展字段
    id: issue.id,
    title: issue.title,
    suggestion: issue.suggestion,
    confidence: issue.confidence,
    category: issue.category,
    instruction: issue.instruction,
    stage: issue.stage,
    stageIndex: issue.stageIndex,
  }
}

// 主校验函数（保持向后兼容）
export function lintDockerfile(content: string): Diagnostic[] {
  // 解析 Dockerfile 为 AST
  const ast = parseDockerfile(content)

  // 运行所有规则
  const issues = runAllRules(ast)

  // 去重
  const { issues: dedupedIssues } = deduplicateIssues(issues)

  // 转换为 Diagnostic 格式
  return dedupedIssues.map(issueToDiagnostic)
}

// 扩展校验函数（返回详细的 LintIssue）
export function lintDockerfileDetailed(content: string): {
  issues: LintIssue[]
  ast: DockerfileAST
} {
  // 解析 Dockerfile 为 AST
  const ast = parseDockerfile(content)

  // 运行所有规则
  const issues = runAllRules(ast)

  // 去重
  const { issues: dedupedIssues } = deduplicateIssues(issues)

  return {
    issues: dedupedIssues,
    ast,
  }
}

// 导出类型和函数
export * from './types'
export * from './parser'
export * from './suppression'
export * from './deduplication'