// ============================================
// 规则文档生成器
// ============================================

import { Rule, Category, Severity, Confidence } from './types'
import { allRules } from './rules'

// 文档格式
export type DocFormat = 'markdown' | 'html' | 'json'

// 类别显示名称
const categoryNames: Record<Category, string> = {
  syntax: '语法规则',
  security: '安全规则',
  'best-practice': '最佳实践',
  semantic: '语义规则',
}

// 严重级别显示名称
const severityNames: Record<Severity, string> = {
  error: '错误',
  warning: '警告',
  security: '安全',
  info: '信息',
}

// 置信度显示名称
const confidenceNames: Record<Confidence, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

// 生成 Markdown 文档
function generateMarkdownDoc(rules: Rule[]): string {
  const lines: string[] = [
    '# Dockerfile Linter 规则文档',
    '',
    `生成时间: ${new Date().toISOString()}`,
    '',
    '---',
    '',
    '## 目录',
    '',
  ]

  // 按类别分组
  const rulesByCategory = new Map<Category, Rule[]>()
  for (const rule of rules) {
    const category = rule.meta.category
    if (!rulesByCategory.has(category)) {
      rulesByCategory.set(category, [])
    }
    rulesByCategory.get(category)!.push(rule)
  }

  // 目录
  for (const [category, categoryRules] of rulesByCategory) {
    lines.push(`- [${categoryNames[category]}](#${category.toLowerCase()})`)
    for (const rule of categoryRules) {
      lines.push(`  - [${rule.meta.id}: ${rule.meta.name}](#${rule.meta.id.toLowerCase()})`)
    }
  }

  lines.push('')
  lines.push('---')
  lines.push('')

  // 规则详情
  for (const [category, categoryRules] of rulesByCategory) {
    lines.push(`## ${categoryNames[category]}`)
    lines.push('')

    for (const rule of categoryRules) {
      lines.push(`### ${rule.meta.id}: ${rule.meta.name}`)
      lines.push('')
      lines.push(`**描述**: ${rule.meta.description}`)
      lines.push('')
      lines.push('| 属性 | 值 |')
      lines.push('| --- | --- |')
      lines.push(`| 严重级别 | ${severityNames[rule.meta.severity]} |`)
      lines.push(`| 置信度 | ${confidenceNames[rule.meta.confidence]} |`)
      lines.push(`| 类别 | ${categoryNames[rule.meta.category]} |`)
      lines.push(`| 适用指令 | ${rule.meta.appliesTo.join(', ')} |`)
      lines.push('')

      if (rule.meta.rationale) {
        lines.push('**为什么存在此规则**:')
        lines.push('')
        lines.push(rule.meta.rationale)
        lines.push('')
      }

      if (rule.meta.examples) {
        lines.push('**示例**:')
        lines.push('')
        lines.push('❌ **反例**:')
        lines.push('```dockerfile')
        lines.push(rule.meta.examples.bad)
        lines.push('```')
        lines.push('')
        lines.push('✅ **正例**:')
        lines.push('```dockerfile')
        lines.push(rule.meta.examples.good)
        lines.push('```')
        lines.push('')
      }

      lines.push('---')
      lines.push('')
    }
  }

  return lines.join('\n')
}

// 生成 HTML 文档
function generateHtmlDoc(rules: Rule[]): string {
  const lines: string[] = [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <title>Dockerfile Linter 规则文档</title>',
    '  <style>',
    '    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }',
    '    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }',
    '    h2 { color: #007bff; margin-top: 40px; }',
    '    h3 { color: #333; background: #f5f5f5; padding: 10px; border-left: 4px solid #007bff; }',
    '    .meta { margin: 10px 0; }',
    '    .meta span { display: inline-block; padding: 2px 8px; margin-right: 8px; border-radius: 4px; font-size: 14px; }',
    '    .severity-error { background: #fee; color: #c00; }',
    '    .severity-warning { background: #ffe; color: #a50; }',
    '    .severity-security { background: #fea; color: #850; }',
    '    .severity-info { background: #eef; color: #05a; }',
    '    .confidence-high { background: #efe; color: #0a0; }',
    '    .confidence-medium { background: #ffe; color: #a50; }',
    '    .confidence-low { background: #eee; color: #666; }',
    '    pre { background: #f8f8f8; padding: 15px; border-radius: 4px; overflow-x: auto; }',
    '    .bad { border-left: 4px solid #dc3545; }',
    '    .good { border-left: 4px solid #28a745; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <h1>Dockerfile Linter 规则文档</h1>',
    `  <p>生成时间: ${new Date().toISOString()}</p>`,
    '',
  ]

  // 按类别分组
  const rulesByCategory = new Map<Category, Rule[]>()
  for (const rule of rules) {
    const category = rule.meta.category
    if (!rulesByCategory.has(category)) {
      rulesByCategory.set(category, [])
    }
    rulesByCategory.get(category)!.push(rule)
  }

  for (const [category, categoryRules] of rulesByCategory) {
    lines.push(`  <h2>${categoryNames[category]}</h2>`)

    for (const rule of categoryRules) {
      lines.push(`  <h3 id="${rule.meta.id.toLowerCase()}">${rule.meta.id}: ${rule.meta.name}</h3>`)
      lines.push(`  <p>${rule.meta.description}</p>`)
      lines.push('  <div class="meta">')
      lines.push(`    <span class="severity-${rule.meta.severity}">${severityNames[rule.meta.severity]}</span>`)
      lines.push(`    <span class="confidence-${rule.meta.confidence}">置信度: ${confidenceNames[rule.meta.confidence]}</span>`)
      lines.push(`    <span>适用: ${rule.meta.appliesTo.join(', ')}</span>`)
      lines.push('  </div>')

      if (rule.meta.rationale) {
        lines.push(`  <p><strong>为什么存在此规则:</strong> ${rule.meta.rationale}</p>`)
      }

      if (rule.meta.examples) {
        lines.push('  <h4>示例</h4>')
        lines.push('  <p>❌ 反例:</p>')
        lines.push(`  <pre class="bad">${escapeHtml(rule.meta.examples.bad)}</pre>`)
        lines.push('  <p>✅ 正例:</p>')
        lines.push(`  <pre class="good">${escapeHtml(rule.meta.examples.good)}</pre>`)
      }

      lines.push('  <hr/>')
    }
  }

  lines.push('</body>')
  lines.push('</html>')

  return lines.join('\n')
}

// 生成 JSON 文档
function generateJsonDoc(rules: Rule[]): string {
  const doc = {
    generatedAt: new Date().toISOString(),
    totalRules: rules.length,
    categories: Object.fromEntries(
      Object.entries(categoryNames).map(([key, name]) => [key, { name, rules: [] as any[] }])
    ),
    rules: rules.map(rule => ({
      id: rule.meta.id,
      name: rule.meta.name,
      description: rule.meta.description,
      category: rule.meta.category,
      categoryName: categoryNames[rule.meta.category],
      severity: rule.meta.severity,
      severityName: severityNames[rule.meta.severity],
      confidence: rule.meta.confidence,
      confidenceName: confidenceNames[rule.meta.confidence],
      appliesTo: rule.meta.appliesTo,
      rationale: rule.meta.rationale,
      examples: rule.meta.examples,
    })),
  }

  // 按类别分组
  for (const rule of doc.rules) {
    doc.categories[rule.category as Category].rules.push(rule.id)
  }

  return JSON.stringify(doc, null, 2)
}

// HTML 转义
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// 生成规则文档
export function generateRuleDoc(format: DocFormat = 'markdown', rules: Rule[] = allRules): string {
  switch (format) {
    case 'markdown':
      return generateMarkdownDoc(rules)
    case 'html':
      return generateHtmlDoc(rules)
    case 'json':
      return generateJsonDoc(rules)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

// 生成规则索引（用于前端展示）
export function generateRuleIndex(): Array<{
  id: string
  name: string
  category: Category
  severity: Severity
  confidence: Confidence
}> {
  return allRules.map(rule => ({
    id: rule.meta.id,
    name: rule.meta.name,
    category: rule.meta.category,
    severity: rule.meta.severity,
    confidence: rule.meta.confidence,
  }))
}

// 获取单个规则的文档
export function getRuleDocumentation(ruleId: string, format: DocFormat = 'markdown'): string | null {
  const rule = allRules.find(r => r.meta.id === ruleId)
  if (!rule) return null
  return generateRuleDoc(format, [rule])
}