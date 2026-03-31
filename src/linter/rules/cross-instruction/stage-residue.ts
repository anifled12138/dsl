// ============================================
// Final Stage 残留检测规则
// ============================================

import { Rule, DockerfileAST, LintIssue } from '../../types'
import { getFinalStageInstructions } from '../../parser'

// 高置信度构建工具残留（运行时不需要）
const HIGH_CONFIDENCE_BUILD_TOOLS = [
  'gcc', 'g++', 'make', 'cmake', 'build-essential',
  'autoconf', 'automake', 'libtool', 'pkg-config',
  'rustc', 'cargo', 'go', 'golang',
]

// 中置信度残留（运行时可能需要）
const MEDIUM_CONFIDENCE_TOOLS = [
  'npm', 'pip', 'pip3', 'yarn', 'pnpm',
  'git', 'svn', 'curl', 'wget',
  'python', 'python3', 'ruby', 'perl',
  'node', 'npm',
]

// 敏感文件残留
const SENSITIVE_RESIDUE_FILES = [
  'id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa', '.ssh',
  '.env', '.env.local', '.env.production', '.env.development',
  'credentials', 'credentials.json', 'secrets', 'secrets.json',
  '.pem', '.key', '.p12', '.pfx', '.crt', '.cer',
  '.npmrc', '.pypirc', '.dockercfg', '_netrc', '.netrc',
]

// X008: 高置信度构建工具残留检测
const ruleX008: Rule = {
  meta: {
    id: 'X008',
    name: '构建工具残留',
    description: 'Final stage 中不应包含构建工具（如 gcc、make、build-essential）',
    category: 'security',
    severity: 'security',
    confidence: 'high',
    appliesTo: ['RUN'],
    rationale: '构建工具在运行时不需要，保留它们会增加镜像体积和安全风险（如编译器可被利用执行任意代码）。',
    examples: {
      bad: `FROM node:18-alpine AS builder
RUN npm install && npm run build

FROM node:18-alpine
COPY --from=builder /app/dist /app
RUN apk add --no-cache gcc g++ make`,
      good: `FROM node:18-alpine AS builder
RUN apk add --no-cache gcc g++ make
RUN npm install && npm run build

FROM node:18-alpine
COPY --from=builder /app/dist /app`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    // 单阶段构建不检测（可能是开发环境）
    if (ast.stages.length <= 1) return issues

    const finalStage = ast.stages[ast.stages.length - 1]
    const finalInstructions = getFinalStageInstructions(ast)

    for (const inst of finalInstructions) {
      if (inst.type !== 'RUN') continue

      // 检测安装命令
      const installPattern = /(apt-get|apk|yum|dnf|pip|npm)\s+(install|add)/i
      if (!installPattern.test(inst.args)) continue

      // 检测高置信度构建工具
      for (const tool of HIGH_CONFIDENCE_BUILD_TOOLS) {
        if (containsTool(inst.args, tool)) {
          issues.push({
            id: 'X008',
            title: '构建工具残留',
            message: `Final stage 中安装了构建工具 "${tool}"，增加镜像体积和安全风险`,
            suggestion: '将构建工具安装在 builder 阶段，final stage 只复制构建产物',
            severity: 'security',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'RUN',
            stage: finalStage.alias,
            stageIndex: finalStage.index,
            category: 'security',
          })
        }
      }
    }

    return issues
  },
}

// X009: 敏感文件残留检测
const ruleX009: Rule = {
  meta: {
    id: 'X009',
    name: '敏感文件残留',
    description: 'Final stage 中不应包含敏感文件（如 .env、id_rsa）',
    category: 'security',
    severity: 'security',
    confidence: 'high',
    appliesTo: ['COPY', 'ADD'],
    rationale: '敏感文件残留会导致安全问题，即使后续删除也会留在镜像层中。',
    examples: {
      bad: `FROM node:18-alpine AS builder
COPY .env /app/.env
RUN npm run build

FROM node:18-alpine
COPY --from=builder /app /app`,
      good: `FROM node:18-alpine AS builder
COPY .env /app/.env
RUN npm run build

FROM node:18-alpine
COPY --from=builder /app/dist /app/dist`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    // 单阶段构建也检测（敏感文件更危险）
    const finalStage = ast.stages[ast.stages.length - 1]
    const finalInstructions = getFinalStageInstructions(ast)

    for (const inst of finalInstructions) {
      if (inst.type !== 'COPY' && inst.type !== 'ADD') continue

      // 如果是 COPY --from，检查源路径是否包含敏感文件
      if (inst.flags.from) {
        // 从其他阶段复制，检查是否整体复制了包含敏感文件的目录
        const args = inst.args
        for (const file of SENSITIVE_RESIDUE_FILES) {
          const pattern = file.startsWith('.')
            ? new RegExp(`\\b${file.replace('.', '\\.')}\\b`)
            : new RegExp(`\\b${file}\\b`)
          if (pattern.test(args)) {
            issues.push({
              id: 'X009',
              title: '敏感文件残留',
              message: `Final stage 复制了敏感文件 "${file}"，存在安全风险`,
              suggestion: '使用 .dockerignore 排除敏感文件，或只复制需要的产物',
              severity: 'security',
              confidence: 'high',
              line: inst.lineStart,
              instruction: inst.type,
              stage: finalStage.alias,
              stageIndex: finalStage.index,
              category: 'security',
            })
          }
        }
      } else {
        // 本地复制，直接检测
        const args = inst.args
        for (const file of SENSITIVE_RESIDUE_FILES) {
          const pattern = file.startsWith('.')
            ? new RegExp(`\\b${file.replace('.', '\\.')}\\b`)
            : new RegExp(`\\b${file}\\b`)
          if (pattern.test(args)) {
            issues.push({
              id: 'X009',
              title: '敏感文件残留',
              message: `Final stage 复制了敏感文件 "${file}"，存在安全风险`,
              suggestion: '使用 .dockerignore 排除敏感文件，或通过 secrets 传递',
              severity: 'security',
              confidence: 'high',
              line: inst.lineStart,
              instruction: inst.type,
              stage: finalStage.alias,
              stageIndex: finalStage.index,
              category: 'security',
            })
          }
        }
      }
    }

    return issues
  },
}

// X010: 中置信度工具残留提示
const ruleX010: Rule = {
  meta: {
    id: 'X010',
    name: '运行时工具残留提示',
    description: 'Final stage 中安装的工具可能运行时不需要',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'medium',
    appliesTo: ['RUN'],
    rationale: '某些工具（如 npm、pip、git）在运行时可能不需要，保留它们会增加镜像体积。',
    examples: {
      bad: `FROM node:18-alpine
RUN apk add --no-cache npm git curl`,
      good: `FROM node:18-alpine AS builder
RUN apk add --no-cache npm git curl
RUN npm install && npm run build

FROM node:18-alpine
COPY --from=builder /app/dist /app/dist`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    // 单阶段构建不检测（可能是开发环境）
    if (ast.stages.length <= 1) return issues

    const finalStage = ast.stages[ast.stages.length - 1]
    const finalInstructions = getFinalStageInstructions(ast)

    for (const inst of finalInstructions) {
      if (inst.type !== 'RUN') continue

      // 检测安装命令
      const installPattern = /(apt-get|apk|yum|dnf|pip|npm)\s+(install|add)/i
      if (!installPattern.test(inst.args)) continue

      // 检测中置信度工具
      for (const tool of MEDIUM_CONFIDENCE_TOOLS) {
        if (containsTool(inst.args, tool)) {
          issues.push({
            id: 'X010',
            title: '运行时工具残留提示',
            message: `Final stage 中安装了 "${tool}"，运行时可能不需要`,
            suggestion: '确认运行时是否需要此工具，如不需要建议移至 builder 阶段',
            severity: 'warning',
            confidence: 'medium',
            line: inst.lineStart,
            instruction: 'RUN',
            stage: finalStage.alias,
            stageIndex: finalStage.index,
            category: 'best-practice',
          })
        }
      }
    }

    return issues
  },
}

// 辅助函数：检测命令中是否包含特定工具
function containsTool(command: string, tool: string): boolean {
  // 匹配工具名称作为独立单词
  // 处理各种安装场景：apk add gcc, apt-get install gcc g++, npm install gcc
  // 转义正则表达式特殊字符
  const escapedTool = tool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const toolPattern = new RegExp(`\\b${escapedTool}\\b`, 'i')
  return toolPattern.test(command)
}

// 导出所有 stage residue 规则
export const stageResidueRules: Rule[] = [
  ruleX008,
  ruleX009,
  ruleX010,
]