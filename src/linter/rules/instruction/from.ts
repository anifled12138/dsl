// ============================================
// FROM 指令规则
// ============================================

import { Rule, DockerfileAST, LintIssue } from '../../types'

// F001: FROM 必须存在
const ruleF001: Rule = {
  meta: {
    id: 'F001',
    name: '缺少 FROM 指令',
    description: 'Dockerfile 必须包含 FROM 指令',
    category: 'syntax',
    severity: 'error',
    confidence: 'high',
    appliesTo: ['*'],
    rationale: 'FROM 指令定义了基础镜像，是 Dockerfile 的必需指令。没有 FROM，Docker 无法知道从哪个镜像开始构建。',
    examples: {
      bad: `# 缺少 FROM
WORKDIR /app
RUN npm install`,
      good: `FROM node:18-alpine
WORKDIR /app
RUN npm install`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    if (!ast.hasFrom) {
      return [{
        id: 'F001',
        title: '缺少 FROM 指令',
        message: 'Dockerfile 必须包含 FROM 指令',
        suggestion: '在文件开头添加 FROM 指令指定基础镜像',
        severity: 'error',
        confidence: 'high',
        line: 1,
        category: 'syntax',
      }]
    }
    return []
  },
}

// F002: FROM 必须在第一条非注释行
const ruleF002: Rule = {
  meta: {
    id: 'F002',
    name: 'FROM 位置错误',
    description: 'FROM 指令必须在第一条非注释行（ARG 除外）',
    category: 'syntax',
    severity: 'error',
    confidence: 'high',
    appliesTo: ['FROM'],
    rationale: 'Dockerfile 必须以 FROM 开始（ARG 可以在 FROM 之前）。其他指令在 FROM 之前是无效的，因为还没有基础镜像。',
    examples: {
      bad: `WORKDIR /app
FROM node:18-alpine
COPY . .`,
      good: `FROM node:18-alpine
WORKDIR /app
COPY . .`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    if (!ast.hasFrom) return []

    // 找到第一条非注释、非 ARG 指令
    for (const inst of ast.instructions) {
      if (inst.isEmpty || inst.isComment) continue
      if (inst.type === 'ARG') continue

      if (inst.type !== 'FROM') {
        return [{
          id: 'F002',
          title: 'FROM 位置错误',
          message: `FROM 指令必须在第一条非注释行（当前是 ${inst.type}）`,
          suggestion: '将 FROM 指令移到文件开头',
          severity: 'error',
          confidence: 'high',
          line: inst.lineStart,
          instruction: inst.type,
          category: 'syntax',
        }]
      }
      break
    }
    return []
  },
}

// F003: FROM 缺少镜像名
const ruleF003: Rule = {
  meta: {
    id: 'F003',
    name: 'FROM 缺少镜像名',
    description: 'FROM 指令必须指定基础镜像名称',
    category: 'syntax',
    severity: 'error',
    confidence: 'high',
    appliesTo: ['FROM'],
    rationale: 'FROM 指令必须指定要使用的基础镜像，否则 Docker 无法确定构建起点。',
    examples: {
      bad: `FROM
WORKDIR /app`,
      good: `FROM node:18-alpine
WORKDIR /app`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'FROM') continue
      if (!inst.args || inst.args.trim() === '' || inst.args.startsWith('--')) {
        issues.push({
          id: 'F003',
          title: 'FROM 缺少镜像名',
          message: 'FROM 指令必须指定基础镜像名称',
          suggestion: '指定镜像名，如 FROM node:18-alpine',
          severity: 'error',
          confidence: 'high',
          line: inst.lineStart,
          instruction: 'FROM',
          category: 'syntax',
        })
      }
    }
    return issues
  },
}

// F004: latest 标签警告
const ruleF004: Rule = {
  meta: {
    id: 'F004',
    name: 'latest 标签警告',
    description: '不建议使用 latest 标签，应指定明确版本',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['FROM'],
    rationale: 'latest 标签会随着时间变化，可能导致构建结果不可重复。指定明确的版本号可以确保构建的一致性。',
    examples: {
      bad: `FROM node:latest
WORKDIR /app`,
      good: `FROM node:18-alpine
WORKDIR /app`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const stage of ast.stages) {
      const inst = ast.instructions[stage.fromInstruction]
      if (!inst) continue

      const image = stage.fromImage
      const tag = stage.fromTag

      // 检查是否使用 latest 或无标签
      if (tag === 'latest' || (!tag && !stage.fromDigest)) {
        issues.push({
          id: 'F004',
          title: 'latest 标签警告',
          message: `建议指定明确的镜像版本，避免使用 latest（镜像: ${image}）`,
          suggestion: `使用明确的版本标签，如 ${image}:18-alpine`,
          severity: 'warning',
          confidence: 'high',
          line: inst.lineStart,
          instruction: 'FROM',
          stage: stage.alias,
          stageIndex: stage.index,
          category: 'best-practice',
        })
      }
    }
    return issues
  },
}

// F005: 镜像名使用变量
const ruleF005: Rule = {
  meta: {
    id: 'F005',
    name: '镜像名使用变量',
    description: '镜像名使用变量时无法验证版本标签',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'medium',
    appliesTo: ['FROM'],
    rationale: '当镜像名使用变量时，无法在静态分析时验证版本标签是否存在。',
    examples: {
      bad: `ARG BASE_IMAGE
FROM \${BASE_IMAGE}
WORKDIR /app`,
      good: `ARG BASE_IMAGE=node:18-alpine
FROM \${BASE_IMAGE}
WORKDIR /app`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const stage of ast.stages) {
      const inst = ast.instructions[stage.fromInstruction]
      if (!inst) continue

      const image = stage.fromImage
      if (image.includes('${') || image.includes('$')) {
        issues.push({
          id: 'F005',
          title: '镜像名使用变量',
          message: `镜像名使用变量，无法验证版本标签: ${image}`,
          suggestion: '如果可能，使用明确的镜像名和版本',
          severity: 'warning',
          confidence: 'medium',
          line: inst.lineStart,
          instruction: 'FROM',
          stage: stage.alias,
          stageIndex: stage.index,
          category: 'best-practice',
        })
      }
    }
    return issues
  },
}

// F006: stage 别名重复
const ruleF006: Rule = {
  meta: {
    id: 'F006',
    name: 'stage 别名重复',
    description: '多阶段构建中的阶段别名不应重复',
    category: 'syntax',
    severity: 'error',
    confidence: 'high',
    appliesTo: ['FROM'],
    rationale: '阶段别名用于 COPY --from 引用，重复的别名会导致歧义。',
    examples: {
      bad: `FROM node:18-alpine AS builder
WORKDIR /app

FROM alpine:3.18 AS builder
COPY --from=builder /app /app`,
      good: `FROM node:18-alpine AS builder
WORKDIR /app

FROM alpine:3.18 AS runner
COPY --from=builder /app /app`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []
    const aliases = new Map<string, number>()

    for (const stage of ast.stages) {
      if (!stage.alias) continue

      const lowerAlias = stage.alias.toLowerCase()
      if (aliases.has(lowerAlias)) {
        const inst = ast.instructions[stage.fromInstruction]
        issues.push({
          id: 'F006',
          title: 'stage 别名重复',
          message: `阶段别名 "${stage.alias}" 已在第 ${aliases.get(lowerAlias)} 行定义`,
          suggestion: '使用唯一的阶段别名',
          severity: 'error',
          confidence: 'high',
          line: inst.lineStart,
          instruction: 'FROM',
          stage: stage.alias,
          stageIndex: stage.index,
          category: 'syntax',
        })
      } else {
        aliases.set(lowerAlias, ast.instructions[stage.fromInstruction]?.lineStart || 0)
      }
    }
    return issues
  },
}

// 导出所有 FROM 规则
export const fromRules: Rule[] = [
  ruleF001,
  ruleF002,
  ruleF003,
  ruleF004,
  ruleF005,
  ruleF006,
]