// ============================================
// 规则去重模块
// ============================================

import { LintIssue, DeduplicatedIssues } from './types'

// 相关规则分组（同一类问题只保留最高优先级的）
const RELATED_RULE_GROUPS: string[][] = [
  // root 运行相关问题
  ['X002', 'U001', 'X003', 'X007'],
  // CMD/ENTRYPOINT 相关问题
  ['C001', 'C002', 'C003', 'C004', 'C005'],
  // FROM 版本问题
  ['F004', 'F005', 'F007'],
  // 缓存清理问题
  ['R005', 'R008', 'R010'],
]

// 严重级别优先级（数字越小优先级越高）
const SEVERITY_PRIORITY: Record<string, number> = {
  'error': 1,
  'security': 2,
  'warning': 3,
  'info': 4,
}

// 生成问题分组键
function getGroupKey(issue: LintIssue): string {
  // 按行号和问题类别分组
  return `${issue.line}:${issue.category}`
}

// 检查两个规则是否相关
function areRulesRelated(ruleId1: string, ruleId2: string): boolean {
  for (const group of RELATED_RULE_GROUPS) {
    if (group.includes(ruleId1) && group.includes(ruleId2)) {
      return true
    }
  }
  return false
}

// 选择最优问题（保留最高优先级的）
function selectBestIssue(issues: LintIssue[]): LintIssue {
  if (issues.length === 1) return issues[0]

  // 按严重级别排序
  return issues.sort((a, b) => {
    const priorityDiff = SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity]
    if (priorityDiff !== 0) return priorityDiff

    // 同级别按置信度排序
    const confidencePriority = { high: 1, medium: 2, low: 3 }
    return confidencePriority[a.confidence] - confidencePriority[b.confidence]
  })[0]
}

// 去重主函数
export function deduplicateIssues(issues: LintIssue[]): DeduplicatedIssues {
  const result: LintIssue[] = []
  const suppressed: Array<{ issue: LintIssue; reason: string }> = []

  // 按行分组
  const lineGroups = new Map<number, LintIssue[]>()
  for (const issue of issues) {
    if (!lineGroups.has(issue.line)) {
      lineGroups.set(issue.line, [])
    }
    lineGroups.get(issue.line)!.push(issue)
  }

  // 处理每一行的问题
  for (const [, lineIssues] of lineGroups) {
    // 按类别分组
    const categoryGroups = new Map<string, LintIssue[]>()
    for (const issue of lineIssues) {
      if (!categoryGroups.has(issue.category)) {
        categoryGroups.set(issue.category, [])
      }
      categoryGroups.get(issue.category)!.push(issue)
    }

    // 处理每个类别
    for (const [, categoryIssues] of categoryGroups) {
      if (categoryIssues.length === 1) {
        result.push(categoryIssues[0])
        continue
      }

      // 检查是否是相关问题
      const relatedGroups: LintIssue[][] = []
      const processed = new Set<number>()

      for (let i = 0; i < categoryIssues.length; i++) {
        if (processed.has(i)) continue

        const group: LintIssue[] = [categoryIssues[i]]
        processed.add(i)

        for (let j = i + 1; j < categoryIssues.length; j++) {
          if (processed.has(j)) continue

          if (areRulesRelated(categoryIssues[i].id, categoryIssues[j].id)) {
            group.push(categoryIssues[j])
            processed.add(j)
          }
        }

        relatedGroups.push(group)
      }

      // 对每个相关组选择最优问题
      for (const group of relatedGroups) {
        if (group.length === 1) {
          result.push(group[0])
        } else {
          const best = selectBestIssue(group)
          result.push(best)

          // 记录被抑制的问题
          for (const issue of group) {
            if (issue !== best) {
              suppressed.push({
                issue,
                reason: `与 ${best.id} 重复，保留更严重的问题`,
              })
            }
          }
        }
      }
    }
  }

  // 按行号排序
  result.sort((a, b) => a.line - b.line)

  return { issues: result, suppressed }
}

// 合并相似问题（将多个相似问题合并为一个更完整的问题）
export function mergeSimilarIssues(issues: LintIssue[]): LintIssue[] {
  const merged = new Map<string, LintIssue>()

  for (const issue of issues) {
    const key = getGroupKey(issue)

    if (merged.has(key)) {
      const existing = merged.get(key)!
      // 合并消息
      if (existing.message !== issue.message) {
        existing.message = `${existing.message}; ${issue.message}`
      }
      // 合并建议
      if (issue.suggestion && !existing.suggestion?.includes(issue.suggestion)) {
        existing.suggestion = existing.suggestion
          ? `${existing.suggestion}; ${issue.suggestion}`
          : issue.suggestion
      }
    } else {
      merged.set(key, { ...issue })
    }
  }

  return Array.from(merged.values())
}

// 过滤低优先级问题（当同一行有更高优先级问题时）
export function filterLowerPriorityIssues(issues: LintIssue[]): LintIssue[] {
  const lineIssues = new Map<number, LintIssue[]>()

  for (const issue of issues) {
    if (!lineIssues.has(issue.line)) {
      lineIssues.set(issue.line, [])
    }
    lineIssues.get(issue.line)!.push(issue)
  }

  const result: LintIssue[] = []

  for (const [, lineIssueList] of lineIssues) {
    // 如果有 error，只保留 error
    const errors = lineIssueList.filter(i => i.severity === 'error')
    if (errors.length > 0) {
      result.push(...errors)
      // 同时保留不同类别的其他问题
      const otherCategories = lineIssueList.filter(
        i => i.severity !== 'error' && !errors.some(e => e.category === i.category)
      )
      result.push(...otherCategories)
    } else {
      result.push(...lineIssueList)
    }
  }

  return result
}

// 聚合同类问题（将相同规则的多处问题合并）
export interface AggregatedIssue {
  id: string
  title: string
  message: string
  suggestion?: string
  severity: LintIssue['severity']
  confidence: LintIssue['confidence']
  category: LintIssue['category']
  locations: Array<{
    line: number
    column?: number
    instruction?: string
    stage?: string
  }>
  count: number
}

// 聚合同一规则的多个问题
export function aggregateIssues(issues: LintIssue[]): Array<LintIssue | AggregatedIssue> {
  // 按规则 ID 分组
  const byRule = new Map<string, LintIssue[]>()

  for (const issue of issues) {
    if (!byRule.has(issue.id)) {
      byRule.set(issue.id, [])
    }
    byRule.get(issue.id)!.push(issue)
  }

  const result: Array<LintIssue | AggregatedIssue> = []

  for (const [, ruleIssues] of byRule) {
    if (ruleIssues.length === 1) {
      // 单个问题直接返回
      result.push(ruleIssues[0])
    } else {
      // 多个相同问题，聚合显示
      const first = ruleIssues[0]
      const aggregated: AggregatedIssue = {
        id: first.id,
        title: first.title,
        message: `发现 ${ruleIssues.length} 处相同问题：${first.message}`,
        suggestion: first.suggestion,
        severity: first.severity,
        confidence: first.confidence,
        category: first.category,
        locations: ruleIssues.map(i => ({
          line: i.line,
          column: i.column,
          instruction: i.instruction,
          stage: i.stage,
        })),
        count: ruleIssues.length,
      }
      result.push(aggregated)
    }
  }

  // 按第一个位置排序
  result.sort((a, b) => {
    const lineA = 'locations' in a ? a.locations[0].line : a.line
    const lineB = 'locations' in b ? b.locations[0].line : b.line
    return lineA - lineB
  })

  return result
}

// 检查是否是聚合问题
export function isAggregatedIssue(issue: LintIssue | AggregatedIssue): issue is AggregatedIssue {
  return 'locations' in issue && 'count' in issue
}

// 将聚合问题展开为普通问题（用于兼容旧接口）
export function expandAggregatedIssues(issues: Array<LintIssue | AggregatedIssue>): LintIssue[] {
  const result: LintIssue[] = []

  for (const issue of issues) {
    if (isAggregatedIssue(issue)) {
      // 展开聚合问题
      for (const loc of issue.locations) {
        result.push({
          id: issue.id,
          title: issue.title,
          message: issue.message,
          suggestion: issue.suggestion,
          severity: issue.severity,
          confidence: issue.confidence,
          line: loc.line,
          column: loc.column,
          instruction: loc.instruction,
          stage: loc.stage,
          category: issue.category,
        })
      }
    } else {
      result.push(issue)
    }
  }

  return result
}