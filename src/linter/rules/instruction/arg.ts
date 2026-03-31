// ============================================
// ARG 指令规则
// ============================================

import { Rule, DockerfileAST, LintIssue } from '../../types'

// A001: ARG 在 FROM 前定义才能在 FROM 中使用
const ruleA001: Rule = {
  meta: {
    id: 'A001',
    name: 'ARG 在 FROM 中的使用',
    description: '在 FROM 指令中使用的 ARG 必须在 FROM 之前定义',
    category: 'syntax',
    severity: 'error',
    confidence: 'high',
    appliesTo: ['FROM'],
    rationale: 'Dockerfile 中，只有在 FROM 之前定义的 ARG 才能在 FROM 指令中使用。FROM 之后的 ARG 无法在 FROM 中引用。',
    examples: {
      bad: `FROM node:18-alpine
ARG NODE_VERSION=18
FROM node:\${NODE_VERSION}
CMD ["node"]`,
      good: `ARG NODE_VERSION=18
FROM node:\${NODE_VERSION}-alpine
CMD ["node"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    // 收集 FROM 之前定义的 ARG
    const argBeforeFrom = new Set<string>()
    let foundFrom = false

    for (const inst of ast.instructions) {
      if (inst.type === 'FROM') {
        foundFrom = true
        // 检查 FROM 中使用的变量
        const fromArgs = inst.args
        const varMatches = fromArgs.matchAll(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g)
        for (const match of varMatches) {
          const varName = match[1]
          if (!argBeforeFrom.has(varName)) {
            // 变量可能是通过 --build-arg 传入的，降级为 warning
            issues.push({
              id: 'A001',
              title: 'ARG 在 FROM 中的使用',
              message: `FROM 指令使用了变量 \${${varName}}，但该 ARG 未在 FROM 之前定义`,
              suggestion: `在 FROM 之前添加 ARG ${varName}=<default_value>，或确保构建时传入 --build-arg ${varName}=xxx`,
              severity: 'warning',
              confidence: 'medium',
              line: inst.lineStart,
              instruction: 'FROM',
              category: 'syntax',
            })
          }
        }
      }

      // 在第一个 FROM 之前收集 ARG
      if (!foundFrom && inst.type === 'ARG') {
        const argMatch = inst.args.match(/^([A-Za-z_][A-Za-z0-9_]*)/)
        if (argMatch) {
          argBeforeFrom.add(argMatch[1])
        }
      }
    }

    return issues
  },
}

// A002: ARG 跨阶段需重新定义
const ruleA002: Rule = {
  meta: {
    id: 'A002',
    name: 'ARG 跨阶段作用域',
    description: 'ARG 定义的变量只在当前阶段有效，跨阶段需要重新定义',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'medium',
    appliesTo: ['ARG'],
    rationale: '每个构建阶段（FROM）都有自己的作用域。ARG 变量只在定义它的阶段有效，如果需要在多个阶段使用，需要在每个阶段重新定义。',
    examples: {
      bad: `ARG APP_VERSION=1.0

FROM node:18-alpine AS builder
# APP_VERSION 在这个阶段不可用
RUN echo $APP_VERSION

FROM node:18-alpine
# 需要重新声明 ARG
RUN echo $APP_VERSION`,
      good: `ARG APP_VERSION=1.0

FROM node:18-alpine AS builder
ARG APP_VERSION
RUN echo $APP_VERSION

FROM node:18-alpine
ARG APP_VERSION
RUN echo $APP_VERSION`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    if (ast.stages.length <= 1) return issues // 单阶段不需要检查

    // 收集 FROM 之前定义的 ARG（全局 ARG）
    const globalArgs = new Set<string>()
    let firstFromFound = false

    for (const inst of ast.instructions) {
      if (inst.type === 'FROM' && !firstFromFound) {
        firstFromFound = true
        continue
      }

      if (!firstFromFound && inst.type === 'ARG') {
        const argMatch = inst.args.match(/^([A-Za-z_][A-Za-z0-9_]*)/)
        if (argMatch) {
          globalArgs.add(argMatch[1])
        }
      }
    }

    // 检查每个阶段是否使用了全局 ARG 但没有重新声明
    for (let i = 0; i < ast.stages.length; i++) {
      const stage = ast.stages[i]
      const stageInstructions = stage.instructions.map(idx => ast.instructions[idx])

      // 收集当前阶段声明的 ARG
      const stageArgs = new Set<string>()

      // 首先检查是否有重新声明
      for (const inst of stageInstructions) {
        if (inst.type === 'ARG') {
          const argMatch = inst.args.match(/^([A-Za-z_][A-Za-z0-9_]*)/)
          if (argMatch) {
            stageArgs.add(argMatch[1])
          }
        }
      }

      // 然后检查是否有使用全局 ARG 但未重新声明
      for (const inst of stageInstructions) {
        if (inst.type === 'RUN' || inst.type === 'ENV' || inst.type === 'COPY') {
          const varMatches = inst.args.matchAll(/\$\{?([A-Za-z_][A-Za-z0-9_]*)\}?/g)
          for (const match of varMatches) {
            const varName = match[1]
            // 如果是全局 ARG，但在当前阶段没有重新声明
            if (globalArgs.has(varName) && !stageArgs.has(varName)) {
              // 只在第一次使用时报告
              issues.push({
                id: 'A002',
                title: 'ARG 跨阶段作用域',
                message: `全局 ARG "${varName}" 在此阶段需要重新声明才能使用`,
                suggestion: `在此阶段开头添加 ARG ${varName}`,
                severity: 'warning',
                confidence: 'medium',
                line: inst.lineStart,
                instruction: inst.type,
                stage: stage.alias,
                stageIndex: stage.index,
                category: 'best-practice',
              })
              // 避免同一阶段多次报告同一变量
              stageArgs.add(varName)
            }
          }
        }
      }
    }

    return issues
  },
}

// A003: build-only 值误用 ENV 提醒
const ruleA003: Rule = {
  meta: {
    id: 'A003',
    name: '构建期变量误用 ENV',
    description: '仅构建期需要的变量应使用 ARG 而非 ENV',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'medium',
    appliesTo: ['ENV'],
    rationale: 'ENV 变量会持久化到镜像中，增加镜像体积和潜在的安全风险。如果变量只在构建期需要，应使用 ARG，它不会保存在最终镜像中。',
    examples: {
      bad: `FROM node:18-alpine
ENV BUILD_VERSION=1.0.0
RUN npm run build
CMD ["node", "server.js"]`,
      good: `FROM node:18-alpine
ARG BUILD_VERSION=1.0.0
RUN npm run build
CMD ["node", "server.js"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    // 构建期变量名模式（这些变量名通常只在构建期需要）
    const buildOnlyPatterns = [
      /^BUILD_/i,
      /^BUILD_VERSION$/i,
      /^BUILD_NUMBER$/i,
      /^NPM_CONFIG_/i,
      /^NODE_ENV$/i, // NODE_ENV 通常用于构建优化
      /^CI_/i,
      /^COMMIT_/i,
      /^GIT_/i,
      /^REVISION$/i,
      /^VERSION$/i,
    ]

    // 检查每个 ENV 指令
    for (const inst of ast.instructions) {
      if (inst.type !== 'ENV') continue

      const args = inst.args
      const keyValueRegex = /([A-Za-z_][A-Za-z0-9_]*)\s*=/g
      let match
      while ((match = keyValueRegex.exec(args)) !== null) {
        const key = match[1]

        // 检查是否匹配构建期变量名模式
        for (const pattern of buildOnlyPatterns) {
          if (pattern.test(key)) {
            // 检查是否只在构建相关命令中使用
            // 如果后续有 RUN 命令使用该变量，且没有 CMD/ENTRYPOINT 使用，则建议改用 ARG
            let usedInBuildOnly = true
            for (const laterInst of ast.instructions) {
              if (laterInst.lineStart <= inst.lineStart) continue
              if (laterInst.type === 'CMD' || laterInst.type === 'ENTRYPOINT') {
                if (laterInst.args.includes(key) || laterInst.args.includes(`\${${key}}`)) {
                  usedInBuildOnly = false
                  break
                }
              }
            }

            if (usedInBuildOnly) {
              issues.push({
                id: 'A003',
                title: '构建期变量误用 ENV',
                message: `变量 "${key}" 可能只在构建期需要，建议使用 ARG 以减少镜像体积`,
                suggestion: `使用 ARG ${key}=xxx 替代 ENV ${key}=xxx`,
                severity: 'warning',
                confidence: 'medium',
                line: inst.lineStart,
                instruction: 'ENV',
                category: 'best-practice',
              })
            }
            break // 每个键只报一次
          }
        }
      }
    }

    return issues
  },
}

// 导出所有 ARG 规则
export const argRules: Rule[] = [
  ruleA001,
  ruleA002,
  ruleA003,
]