// ============================================
// Stage Graph 规则 - 阶段优化检测
// ============================================

import { Rule, DockerfileAST, LintIssue } from '../../types'

// X012: unused stage（未使用阶段）提醒
const ruleX012: Rule = {
  meta: {
    id: 'X012',
    name: '未使用阶段提醒',
    description: '检测未被 COPY --from 引用的构建阶段',
    category: 'best-practice',
    severity: 'info',
    confidence: 'high',
    appliesTo: ['FROM'],
    rationale: '未使用的阶段会增加构建时间，建议删除或确认其用途。',
    examples: {
      bad: `FROM node:18-alpine AS builder
RUN npm install && npm run build

FROM node:18-alpine AS unused
RUN echo "this stage is never used"

FROM node:18-alpine
COPY --from=builder /app/dist /app/dist`,
      good: `FROM node:18-alpine AS builder
RUN npm install && npm run build

FROM node:18-alpine
COPY --from=builder /app/dist /app/dist`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    // 单阶段构建不检测
    if (ast.stages.length <= 1) return issues

    const stageGraph = ast.stageGraph
    if (!stageGraph) return issues

    for (const unusedIndex of stageGraph.unusedStages) {
      const stage = ast.stages[unusedIndex]
      const fromInst = ast.instructions[stage.fromInstruction]

      issues.push({
        id: 'X012',
        title: '未使用阶段提醒',
        message: `阶段 "${stage.alias || `stage ${stage.index}`}" 未被任何 COPY --from 引用`,
        suggestion: '确认阶段用途，如不需要建议删除以减少构建时间',
        severity: 'info',
        confidence: 'high',
        line: fromInst.lineStart,
        instruction: 'FROM',
        stage: stage.alias,
        stageIndex: stage.index,
        category: 'best-practice',
      })
    }

    return issues
  },
}

// X013: unreachable stage（不可达阶段）提醒
const ruleX013: Rule = {
  meta: {
    id: 'X013',
    name: '不可达阶段提醒',
    description: '检测因循环依赖导致不可达的构建阶段',
    category: 'semantic',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['FROM'],
    rationale: '不可达阶段由于循环依赖无法正确构建，需要重新设计阶段依赖链路。',
    examples: {
      bad: `FROM node:18-alpine AS stage1
COPY --from=stage2 /app /app

FROM node:18-alpine AS stage2
COPY --from=stage1 /app /app

FROM node:18-alpine
COPY --from=stage1 /app /app`,
      good: `FROM node:18-alpine AS builder
RUN npm install && npm run build

FROM node:18-alpine AS runtime
COPY --from=builder /app/dist /app

FROM node:18-alpine
COPY --from=runtime /app /app`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    // 单阶段构建不检测
    if (ast.stages.length <= 1) return issues

    const stageGraph = ast.stageGraph
    if (!stageGraph) return issues

    for (const unreachableIndex of stageGraph.unreachableStages) {
      const stage = ast.stages[unreachableIndex]
      const fromInst = ast.instructions[stage.fromInstruction]

      issues.push({
        id: 'X013',
        title: '不可达阶段提醒',
        message: `阶段 "${stage.alias || `stage ${stage.index}`}" 因循环依赖不可达`,
        suggestion: '重新设计阶段依赖链路，确保每个阶段都能正确构建',
        severity: 'warning',
        confidence: 'high',
        line: fromInst.lineStart,
        instruction: 'FROM',
        stage: stage.alias,
        stageIndex: stage.index,
        category: 'semantic',
      })
    }

    // 如果有循环依赖，添加总体提示
    if (stageGraph.circularDependencies.length > 0) {
      for (const cycle of stageGraph.circularDependencies) {
        const cycleNames = cycle.map(i => ast.stages[i].alias || `stage ${i}`).join(' → ')
        // 只报告一次，放在第一个循环阶段的 FROM 指令上
        const firstStage = ast.stages[cycle[0]]
        const fromInst = ast.instructions[firstStage.fromInstruction]

        issues.push({
          id: 'X013',
          title: '循环依赖检测',
          message: `检测到循环依赖链路: ${cycleNames}`,
          suggestion: '重新设计阶段依赖顺序，避免 A → B → A 形式的循环',
          severity: 'warning',
          confidence: 'high',
          line: fromInst.lineStart,
          instruction: 'FROM',
          stage: firstStage.alias,
          stageIndex: firstStage.index,
          category: 'semantic',
        })
      }
    }

    return issues
  },
}

// 导出所有 stage graph 规则
export const stageGraphRules: Rule[] = [
  ruleX012,
  ruleX013,
]