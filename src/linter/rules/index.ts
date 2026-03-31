// ============================================
// 规则模块入口
// ============================================

import { DockerfileAST, LintIssue, Rule } from '../types'

// 导出所有规则
export * from './instruction/from'
export * from './instruction/run'
export * from './instruction/cmd'
export * from './instruction/copy'
export * from './instruction/env'
export * from './instruction/arg'
export * from './instruction/expose'
export * from './instruction/shell'
export * from './cross-instruction/user-check'
export * from './cross-instruction/stage-residue'
export * from './cross-instruction/stage-graph-rules'
export * from './cross-instruction/context-check'

// 所有规则列表
import { fromRules } from './instruction/from'
import { runRules } from './instruction/run'
import { cmdRules } from './instruction/cmd'
import { copyRules } from './instruction/copy'
import { envRules } from './instruction/env'
import { argRules } from './instruction/arg'
import { exposeRules } from './instruction/expose'
import { shellRules } from './instruction/shell'
import { crossInstructionRules } from './cross-instruction/user-check'
import { stageResidueRules } from './cross-instruction/stage-residue'
import { stageGraphRules } from './cross-instruction/stage-graph-rules'
import { contextCheckRules } from './cross-instruction/context-check'

// 合并所有规则
export const allRules: Rule[] = [
  ...fromRules,
  ...runRules,
  ...cmdRules,
  ...copyRules,
  ...envRules,
  ...argRules,
  ...exposeRules,
  ...shellRules,
  ...crossInstructionRules,
  ...stageResidueRules,
  ...stageGraphRules,
  ...contextCheckRules,
]

// 运行所有规则
export function runAllRules(ast: DockerfileAST): LintIssue[] {
  const issues: LintIssue[] = []

  for (const rule of allRules) {
    try {
      const ruleIssues = rule.check(ast)
      issues.push(...ruleIssues)
    } catch (error) {
      console.error(`Rule ${rule.meta.id} failed:`, error)
    }
  }

  return issues
}