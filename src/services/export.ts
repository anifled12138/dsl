// ============================================
// Export Service - 导出诊断报告
// ============================================

import type { Diagnostic } from '../types'

// 导出格式
export type ExportFormat = 'json' | 'markdown'

// 导出配置
export interface ExportOptions {
  format?: ExportFormat
  includeCode?: boolean
  includeSuggestions?: boolean
  timestamp?: Date
}

// 生成 JSON 导出
export function generateJsonExport(
  dockerfile: string,
  diagnostics: Diagnostic[],
  options?: ExportOptions
): string {
  const exportData = {
    timestamp: options?.timestamp?.toISOString() || new Date().toISOString(),
    dockerfile: options?.includeCode ? dockerfile : undefined,
    summary: {
      total: diagnostics.length,
      errors: diagnostics.filter(d => d.severity === 'error').length,
      warnings: diagnostics.filter(d => d.severity === 'warning').length,
      securities: diagnostics.filter(d => d.severity === 'security').length,
      infos: diagnostics.filter(d => d.severity === 'info').length,
    },
    diagnostics: diagnostics.map(d => ({
      id: d.id,
      line: d.line,
      lineEnd: d.lineEnd,
      column: d.column,
      severity: d.severity,
      category: d.category,
      confidence: d.confidence,
      message: d.message,
      title: d.title,
      suggestion: options?.includeSuggestions ? d.suggestion : undefined,
      instruction: d.instruction,
      stage: d.stage,
    })),
  }

  return JSON.stringify(exportData, null, 2)
}

// 生成 Markdown 导出
export function generateMarkdownExport(
  dockerfile: string,
  diagnostics: Diagnostic[],
  options?: ExportOptions
): string {
  const timestamp = options?.timestamp?.toLocaleString() || new Date().toLocaleString()
  const errors = diagnostics.filter(d => d.severity === 'error')
  const warnings = diagnostics.filter(d => d.severity === 'warning')
  const securities = diagnostics.filter(d => d.severity === 'security')
  const infos = diagnostics.filter(d => d.severity === 'info')

  let md = `# Dockerfile Linter 报告\n\n`
  md += `**生成时间**: ${timestamp}\n\n`

  // 概览
  md += `## 概览\n\n`
  md += `| 类型 | 数量 |\n`
  md += `|------|------|\n`
  md += `| 🔴 错误 | ${errors.length} |\n`
  md += `| 🔒 安全 | ${securities.length} |\n`
  md += `| 🟡 警告 | ${warnings.length} |\n`
  md += `| ℹ️ 信息 | ${infos.length} |\n`
  md += `| **总计** | **${diagnostics.length}** |\n\n`

  // 通过状态
  if (errors.length === 0 && securities.length === 0) {
    md += `✅ **校验通过** - 没有发现错误或安全问题\n\n`
  } else {
    md += `❌ **校验失败** - 发现 ${errors.length + securities.length} 个严重问题\n\n`
  }

  // Dockerfile 内容（可选）
  if (options?.includeCode) {
    md += `## Dockerfile 内容\n\n`
    md += '```dockerfile\n'
    md += dockerfile
    md += '\n```\n\n'
  }

  // 错误详情
  if (errors.length > 0) {
    md += `## 🔴 错误 (${errors.length})\n\n`
    for (const d of errors) {
      md += formatDiagnostic(d, options?.includeSuggestions)
    }
  }

  // 安全问题详情
  if (securities.length > 0) {
    md += `## 🔒 安全问题 (${securities.length})\n\n`
    for (const d of securities) {
      md += formatDiagnostic(d, options?.includeSuggestions)
    }
  }

  // 警告详情
  if (warnings.length > 0) {
    md += `## 🟡 警告 (${warnings.length})\n\n`
    for (const d of warnings) {
      md += formatDiagnostic(d, options?.includeSuggestions)
    }
  }

  // 信息详情
  if (infos.length > 0) {
    md += `## ℹ️ 信息 (${infos.length})\n\n`
    for (const d of infos) {
      md += formatDiagnostic(d, options?.includeSuggestions)
    }
  }

  return md
}

// 格式化单个诊断
function formatDiagnostic(d: Diagnostic, includeSuggestions?: boolean): string {
  let text = `### ${d.id || 'N/A'} - 行 ${d.line}${d.lineEnd && d.lineEnd > d.line ? `-${d.lineEnd}` : ''}\n\n`
  text += `**消息**: ${d.message}\n\n`

  if (d.category) {
    text += `**类别**: ${d.category}\n\n`
  }

  if (d.confidence) {
    text += `**置信度**: ${d.confidence}\n\n`
  }

  if (includeSuggestions && d.suggestion) {
    text += `**建议**: ${d.suggestion}\n\n`
  }

  text += `---\n\n`

  return text
}

// 下载文件
export function downloadExport(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 导出为 JSON 文件
export function exportToJson(
  dockerfile: string,
  diagnostics: Diagnostic[],
  options?: ExportOptions
): void {
  const content = generateJsonExport(dockerfile, diagnostics, options)
  const timestamp = new Date().toISOString().split('T')[0]
  downloadExport(content, `dockerfile-lint-report-${timestamp}.json`)
}

// 导出为 Markdown 文件
export function exportToMarkdown(
  dockerfile: string,
  diagnostics: Diagnostic[],
  options?: ExportOptions
): void {
  const content = generateMarkdownExport(dockerfile, diagnostics, options)
  const timestamp = new Date().toISOString().split('T')[0]
  downloadExport(content, `dockerfile-lint-report-${timestamp}.md`)
}