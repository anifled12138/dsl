// ============================================
// COPY/ADD 指令规则
// ============================================

import { Rule, DockerfileAST, LintIssue } from '../../types'
import { getStageAliases } from '../../parser'
import { shouldSuppressSensitiveFileCopy } from '../../suppression'

// 敏感文件列表
const SENSITIVE_FILES = [
  // 环境变量和配置
  '.env', '.env.local', '.env.production', '.env.development',
  // SSH 密钥
  'id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa',
  // 证书和密钥
  '.pem', '.key', '.p12', '.pfx', '.crt', '.cer',
  // Git
  '.git', '.gitignore', '.gitattributes',
  // 凭证
  'credentials', 'secrets', 'credentials.json', 'secrets.json',
  // 其他
  'node_modules', '.npmrc', '.pypirc', '.dockercfg',
]

// CP001: COPY/ADD 缺少路径参数
const ruleCP001: Rule = {
  meta: {
    id: 'CP001',
    name: '缺少路径参数',
    description: 'COPY/ADD 指令需要指定源路径和目标路径',
    category: 'syntax',
    severity: 'error',
    confidence: 'high',
    appliesTo: ['COPY', 'ADD'],
    rationale: 'COPY 和 ADD 指令至少需要两个参数：源路径和目标路径。',
    examples: {
      bad: `FROM node:18-alpine
COPY .`,
      good: `FROM node:18-alpine
COPY . .`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'COPY' && inst.type !== 'ADD') continue

      // 移除标志参数后检查参数数量
      const cleanArgs = inst.args
        .replace(/--from=\S+\s*/gi, '')
        .replace(/--chown=\S+\s*/gi, '')
        .replace(/--link\s*/gi, '')
        .trim()

      const parts = cleanArgs.split(/\s+/).filter(p => p)
      if (parts.length < 2) {
        issues.push({
          id: 'CP001',
          title: '缺少路径参数',
          message: `${inst.type} 指令需要指定源路径和目标路径`,
          suggestion: '添加目标路径，如 COPY . .',
          severity: 'error',
          confidence: 'high',
          line: inst.lineStart,
          instruction: inst.type,
          stageIndex: inst.stageIndex,
          category: 'syntax',
        })
      }
    }
    return issues
  },
}

// CP002: ADD 远程 URL 警告
const ruleCP002: Rule = {
  meta: {
    id: 'CP002',
    name: 'ADD 远程 URL 警告',
    description: '不建议使用 ADD 从远程下载文件',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['ADD'],
    rationale: 'ADD 从远程下载时无法验证文件完整性。建议使用 RUN curl/wget 下载并验证哈希值。',
    examples: {
      bad: `FROM ubuntu:20.04
ADD https://example.com/file.tar.gz /tmp/`,
      good: `FROM ubuntu:20.04
RUN curl -fsSL https://example.com/file.tar.gz -o /tmp/file.tar.gz && \\
    echo "expected-sha256 /tmp/file.tar.gz" | sha256sum -c && \\
    tar -xzf /tmp/file.tar.gz`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'ADD') continue

      const args = inst.args
      const parts = args.split(/\s+/).filter(p => p)

      if (parts.length > 0) {
        const source = parts[0]
        if (source.startsWith('http://') || source.startsWith('https://')) {
          issues.push({
            id: 'CP002',
            title: 'ADD 远程 URL 警告',
            message: '不建议使用 ADD 从远程下载文件，建议使用 RUN curl/wget',
            suggestion: '使用 RUN curl/wget 下载并验证文件完整性',
            severity: 'warning',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'ADD',
            stageIndex: inst.stageIndex,
            category: 'best-practice',
          })
        }
      }
    }
    return issues
  },
}

// CP003: COPY --from 引用检查（增强版）
const ruleCP003: Rule = {
  meta: {
    id: 'CP003',
    name: 'COPY --from 引用检查',
    description: 'COPY --from 引用检查：自引用、循环引用、未定义阶段、外部镜像歧义',
    category: 'semantic',
    severity: 'error',
    confidence: 'high',
    appliesTo: ['COPY'],
    rationale: 'COPY --from 引用不存在的阶段会导致构建失败。自引用和循环引用是逻辑错误。引用外部镜像而非阶段时需要明确意图。',
    examples: {
      bad: `FROM node:18-alpine AS builder
COPY --from=builder . .

FROM alpine:3.18
COPY --from=nonexistent /app /app`,
      good: `FROM node:18-alpine AS builder
WORKDIR /app

FROM alpine:3.18
COPY --from=builder /app /app`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []
    const stageAliases = getStageAliases(ast)
    const stageGraph = ast.stageGraph

    // 构建别名到索引的映射
    const aliasToIndex = new Map<string, number>()
    for (const stage of ast.stages) {
      if (stage.alias) {
        aliasToIndex.set(stage.alias.toLowerCase(), stage.index)
      }
    }

    for (const inst of ast.instructions) {
      if (inst.type !== 'COPY') continue

      const fromFlag = inst.flags.from
      if (!fromFlag) continue

      const currentStage = ast.stages[inst.stageIndex]
      const fromFlagLower = fromFlag.toLowerCase()

      // 1. 自引用检测
      if (currentStage?.alias?.toLowerCase() === fromFlagLower) {
        issues.push({
          id: 'CP003',
          title: 'COPY --from 自引用错误',
          message: `COPY --from 不能引用当前阶段 "${fromFlag}"`,
          suggestion: '引用其他阶段的别名或使用 COPY 不带 --from',
          severity: 'error',
          confidence: 'high',
          line: inst.lineStart,
          instruction: 'COPY',
          stage: currentStage.alias,
          stageIndex: inst.stageIndex,
          category: 'semantic',
        })
        continue
      }

      // 2. 循环引用检测（使用 Stage Graph）
      if (stageGraph && currentStage) {
        // 检查是否存在循环依赖
        for (const cycle of stageGraph.circularDependencies) {
          if (cycle.includes(inst.stageIndex)) {
            // 当前阶段在循环中
            if (aliasToIndex.has(fromFlagLower) && cycle.includes(aliasToIndex.get(fromFlagLower)!)) {
              issues.push({
                id: 'CP003',
                title: 'COPY --form 循环引用错误',
                message: `COPY --from="${fromFlag}" 形成循环依赖，阶段无法正确构建`,
                suggestion: '重新设计阶段依赖链路，避免循环引用',
                severity: 'error',
                confidence: 'high',
                line: inst.lineStart,
                instruction: 'COPY',
                stage: currentStage.alias,
                stageIndex: inst.stageIndex,
                category: 'semantic',
              })
              continue
            }
          }
        }
      }

      // 3. 前向引用检测（引用尚未定义的后续阶段）
      if (aliasToIndex.has(fromFlagLower)) {
        const referencedIndex = aliasToIndex.get(fromFlagLower)!
        if (referencedIndex > inst.stageIndex) {
          // 引用了后续阶段（前向引用）
          // Docker 允许这种情况，但可能是设计错误
          issues.push({
            id: 'CP003',
            title: 'COPY --from 前向引用警告',
            message: `COPY --from="${fromFlag}" 引用了后续定义的阶段，可能是设计错误`,
            suggestion: '确认依赖顺序是否正确，通常后续阶段不应依赖前面的阶段',
            severity: 'warning',
            confidence: 'medium',
            line: inst.lineStart,
            instruction: 'COPY',
            stage: currentStage.alias,
            stageIndex: inst.stageIndex,
            category: 'semantic',
          })
          continue
        }
      }

      // 4. 未定义阶段检测 vs 外部镜像
      if (!stageAliases.has(fromFlagLower)) {
        // 检查是否可能是外部镜像（包含 : 或 @）
        if (fromFlag.includes(':') || fromFlag.includes('@') || fromFlag.includes('/')) {
          // 看起来像镜像名，如 alpine:3.18 或 nginx@sha256:xxx
          issues.push({
            id: 'CP003',
            title: 'COPY --from 可能引用外部镜像',
            message: `COPY --from="${fromFlag}" 引用了未定义的阶段，可能是外部镜像`,
            suggestion: '如果引用外部镜像，确认镜像存在。如果是阶段别名，请使用 AS 定义',
            severity: 'info',
            confidence: 'medium',
            line: inst.lineStart,
            instruction: 'COPY',
            stage: currentStage.alias,
            stageIndex: inst.stageIndex,
            category: 'semantic',
          })
        } else {
          // 明确不是镜像格式，是未定义的阶段别名
          issues.push({
            id: 'CP003',
            title: 'COPY --from 引用不存在',
            message: `COPY --from 引用的阶段 "${fromFlag}" 不存在`,
            suggestion: '确保引用的阶段别名已通过 AS 定义',
            severity: 'error',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'COPY',
            stage: currentStage.alias,
            stageIndex: inst.stageIndex,
            category: 'semantic',
          })
        }
      }
    }
    return issues
  },
}

// CP004: 敏感文件复制警告
const ruleCP004: Rule = {
  meta: {
    id: 'CP004',
    name: '敏感文件复制警告',
    description: '复制敏感文件到镜像可能导致安全问题',
    category: 'security',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['COPY', 'ADD'],
    rationale: '将敏感文件（如 .env、id_rsa）复制到镜像会导致安全问题，即使后续删除也会留在镜像层中。',
    examples: {
      bad: `FROM node:18-alpine
COPY .env ./
COPY id_rsa /root/.ssh/`,
      good: `FROM node:18-alpine
# 使用 .dockerignore 排除敏感文件
# 敏感信息应通过 secrets 或环境变量传递`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'COPY' && inst.type !== 'ADD') continue

      const args = inst.args

      for (const sensitive of SENSITIVE_FILES) {
        // 检查是否复制敏感文件
        const pattern = sensitive.startsWith('.')
          ? new RegExp(`\\b${sensitive.replace('.', '\\.')}\\b`)
          : new RegExp(`\\b${sensitive}\\b`)

        if (pattern.test(args)) {
          const suppression = shouldSuppressSensitiveFileCopy(ast, inst, sensitive)
          if (!suppression.suppressed) {
            issues.push({
              id: 'CP004',
              title: '敏感文件复制警告',
              message: `复制敏感文件 "${sensitive}" 到镜像可能导致安全问题`,
              suggestion: '使用 .dockerignore 排除敏感文件，或通过 secrets 传递',
              severity: 'warning',
              confidence: 'high',
              line: inst.lineStart,
              instruction: inst.type,
              stageIndex: inst.stageIndex,
              category: 'security',
            })
            break // 每行只报一次
          }
        }
      }
    }
    return issues
  },
}

// CP005: COPY . . 过宽复制警告
const ruleCP005: Rule = {
  meta: {
    id: 'CP005',
    name: '过宽复制警告',
    description: 'COPY . . 可能复制敏感文件',
    category: 'security',
    severity: 'info',
    confidence: 'low',
    appliesTo: ['COPY'],
    rationale: 'COPY . . 会复制构建上下文中的所有文件，可能包含 .git、.env 等敏感文件。',
    examples: {
      bad: `FROM node:18-alpine
COPY . .
RUN npm install`,
      good: `FROM node:18-alpine
COPY package*.json ./
RUN npm install
COPY src/ ./src/`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'COPY') continue

      const args = inst.args
        .replace(/--from=\S+\s*/gi, '')
        .replace(/--chown=\S+\s*/gi, '')
        .trim()

      // 检测 COPY . .
      if (/^\.\s+\.\s*$/.test(args) || /^\.\s+\.$/.test(args)) {
        issues.push({
          id: 'CP005',
          title: '过宽复制警告',
          message: 'COPY . . 可能复制敏感文件如 .git、.env 等',
          suggestion: '只复制需要的文件，或使用 .dockerignore 排除敏感文件',
          severity: 'info',
          confidence: 'low',
          line: inst.lineStart,
          instruction: 'COPY',
          stageIndex: inst.stageIndex,
          category: 'security',
        })
      }
    }
    return issues
  },
}

// CP006: --chown 建议
const ruleCP006: Rule = {
  meta: {
    id: 'CP006',
    name: '--chown 建议使用',
    description: 'COPY/ADD 建议使用 --chown 设置文件所有者',
    category: 'best-practice',
    severity: 'info',
    confidence: 'low',
    appliesTo: ['COPY', 'ADD'],
    rationale: '使用 --chown 可以在复制时设置正确的文件所有者，避免后续需要额外的 chown 命令。',
    examples: {
      bad: `FROM node:18-alpine
USER node
COPY . .`,
      good: `FROM node:18-alpine
USER node
COPY --chown=node:node . .`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const stage of ast.stages) {
      // 找到 USER 指令后的 COPY/ADD
      let hasUser = false

      for (const idx of stage.instructions) {
        const inst = ast.instructions[idx]

        if (inst.type === 'USER') {
          hasUser = true
        }

        if ((inst.type === 'COPY' || inst.type === 'ADD') && hasUser) {
          if (!inst.flags.chown) {
            issues.push({
              id: 'CP006',
              title: '--chown 建议使用',
              message: `${inst.type} 建议使用 --chown 设置文件所有者，与 USER 指令配合`,
              suggestion: `添加 --chown=<user>:<group>`,
              severity: 'info',
              confidence: 'low',
              line: inst.lineStart,
              instruction: inst.type,
              stage: stage.alias,
              stageIndex: stage.index,
              category: 'best-practice',
            })
          }
        }
      }
    }
    return issues
  },
}

// 导出所有 COPY/ADD 规则
export const copyRules: Rule[] = [
  ruleCP001,
  ruleCP002,
  ruleCP003,
  ruleCP004,
  ruleCP005,
  ruleCP006,
]