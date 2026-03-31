// ============================================
// 跨指令规则
// ============================================

import { Rule, DockerfileAST, LintIssue, ParsedInstruction } from '../../types'

// X002: final stage 缺少 USER
const ruleX002: Rule = {
  meta: {
    id: 'X002',
    name: 'USER 指令检查',
    description: '检测容器是否以非 root 用户运行，未设置 USER 或最终 USER 为 root 时发出警告',
    category: 'security',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['*'],
    rationale: '容器默认以 root 用户运行，存在安全风险。应使用 USER 指令指定非特权用户，限制容器被攻破后的影响范围。',
    examples: {
      bad: `FROM node:18-alpine
WORKDIR /app
COPY . .
CMD ["node", "server.js"]`,
      good: `FROM node:18-alpine
WORKDIR /app
COPY . .
USER node
CMD ["node", "server.js"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    if (ast.stages.length === 0) return issues

    const finalStage = ast.stages[ast.stages.length - 1]
    const finalInstructions = finalStage.instructions.map(i => ast.instructions[i])

    // 检查是否有 USER 指令
    const userInstructions = finalInstructions.filter(i => i.type === 'USER')

    if (userInstructions.length === 0) {
      // 没有 USER 指令，检查是否有 CMD/ENTRYPOINT
      const hasCmdOrEntrypoint = finalInstructions.some(
        i => i.type === 'CMD' || i.type === 'ENTRYPOINT'
      )

      if (hasCmdOrEntrypoint) {
        issues.push({
          id: 'X002',
          title: '未检测到 USER 指令',
          message: '未检测到 USER 指令，容器可能以 root 用户运行',
          suggestion: '建议显式设置非 root 用户以提高安全性，如 USER node 或创建新用户',
          severity: 'warning',
          confidence: 'high',
          line: finalInstructions[finalInstructions.length - 1]?.lineStart || 1,
          stage: finalStage.alias,
          stageIndex: finalStage.index,
          category: 'security',
        })
      }
    } else {
      // 有 USER 指令，检查最后一个 USER 是否是 root
      const lastUser = userInstructions[userInstructions.length - 1]
      const userArg = lastUser.args.trim().toLowerCase()

      if (userArg === 'root' || userArg === '0') {
        issues.push({
          id: 'X002',
          title: '容器最终以 root 用户运行',
          message: '容器最终以 root 用户运行，存在安全风险',
          suggestion: '建议使用非 root 用户运行，或删除最后的 USER root 指令',
          severity: 'warning',
          confidence: 'high',
          line: lastUser.lineStart,
          instruction: 'USER',
          stage: finalStage.alias,
          stageIndex: finalStage.index,
          category: 'security',
        })
      }
    }

    return issues
  },
}

// X003: USER 切换后又切回 root
const ruleX003: Rule = {
  meta: {
    id: 'X003',
    name: '用户切换异常',
    description: '先切换到普通用户后又切回 root，可能是误操作',
    category: 'security',
    severity: 'warning',
    confidence: 'medium',
    appliesTo: ['USER'],
    rationale: '如果已经切换到普通用户，后面又切回 root，说明可能存在权限问题需要排查，或者是不必要的操作。',
    examples: {
      bad: `FROM node:18-alpine
USER node
COPY . .
USER root
CMD ["node", "server.js"]`,
      good: `FROM node:18-alpine
COPY . .
USER node
CMD ["node", "server.js"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const stage of ast.stages) {
      const stageInstructions = stage.instructions.map(i => ast.instructions[i])
      const userInstructions = stageInstructions.filter(i => i.type === 'USER')

      let hadNonRootUser = false

      for (const inst of userInstructions) {
        const userArg = inst.args.trim().toLowerCase()

        if (userArg !== 'root' && userArg !== '0') {
          hadNonRootUser = true
        } else if (hadNonRootUser && (userArg === 'root' || userArg === '0')) {
          issues.push({
            id: 'X003',
            title: '用户切换异常',
            message: '先切换到普通用户后又切回 root，可能是误操作',
            suggestion: '确认是否真的需要 root 权限，或者调整指令顺序',
            severity: 'warning',
            confidence: 'medium',
            line: inst.lineStart,
            instruction: 'USER',
            stage: stage.alias,
            stageIndex: stage.index,
            category: 'security',
          })
        }
      }
    }

    return issues
  },
}

// X004: WORKDIR 在 COPY 之前
const ruleX004: Rule = {
  meta: {
    id: 'X004',
    name: 'WORKDIR 应在 COPY 之前设置',
    description: '建议在 COPY 之前设置 WORKDIR',
    category: 'best-practice',
    severity: 'info',
    confidence: 'low',
    appliesTo: ['COPY', 'WORKDIR'],
    rationale: '在 COPY 之前设置 WORKDIR 可以确保文件复制到正确的目录，避免使用绝对路径。',
    examples: {
      bad: `FROM node:18-alpine
COPY . /app
WORKDIR /app`,
      good: `FROM node:18-alpine
WORKDIR /app
COPY . .`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const stage of ast.stages) {
      const stageInstructions = stage.instructions.map(i => ast.instructions[i])

      let workdirSet = false

      for (const inst of stageInstructions) {
        if (inst.type === 'WORKDIR') {
          workdirSet = true
        }

        if (inst.type === 'COPY' && !workdirSet) {
          // COPY 在 WORKDIR 之前
          const targetArg = inst.args.split(/\s+/).pop()

          // 如果目标路径是绝对路径，说明可能是故意的
          if (targetArg && !targetArg.startsWith('/')) {
            issues.push({
              id: 'X004',
              title: 'WORKDIR 应在 COPY 之前设置',
              message: '建议在 COPY 之前设置 WORKDIR，确保文件复制到正确目录',
              suggestion: '在 COPY 之前添加 WORKDIR 指令',
              severity: 'info',
              confidence: 'low',
              line: inst.lineStart,
              instruction: 'COPY',
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

// X005: 长期服务缺少 HEALTHCHECK
const ruleX005: Rule = {
  meta: {
    id: 'X005',
    name: '长期服务缺少 HEALTHCHECK',
    description: '长期运行的服务建议添加 HEALTHCHECK',
    category: 'best-practice',
    severity: 'info',
    confidence: 'low',
    appliesTo: ['*'],
    rationale: 'HEALTHCHECK 允许 Docker 监控容器健康状态，对于长期运行的服务（如 Web 服务器）非常重要。',
    examples: {
      bad: `FROM node:18-alpine
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`,
      good: `FROM node:18-alpine
WORKDIR /app
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD curl -f http://localhost:3000/health || exit 1
CMD ["node", "server.js"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    if (ast.stages.length === 0) return issues

    const finalStage = ast.stages[ast.stages.length - 1]
    const finalInstructions = finalStage.instructions.map(i => ast.instructions[i])

    // 检查是否有 HEALTHCHECK
    const hasHealthcheck = finalInstructions.some(i => i.type === 'HEALTHCHECK')
    if (hasHealthcheck) return issues

    // 查找 CMD 或 ENTRYPOINT
    const lastCmd = [...finalInstructions].reverse().find(
      i => i.type === 'CMD' || i.type === 'ENTRYPOINT'
    )
    if (!lastCmd) return issues

    // 检查命令是否是服务型命令
    const cmdArgs = lastCmd.args.toLowerCase()

    // 排除列表：非服务型命令
    const nonServicePatterns = [
      /^"bash"$/, /^"sh"$/, /^\["bash"\]$/, /^\["sh"\]$/,
      /sleep\s+infinity/, /tail\s+-f/, /^"cat"$/,
    ]

    for (const pattern of nonServicePatterns) {
      if (pattern.test(cmdArgs)) {
        return issues // 非服务型命令，不触发
      }
    }

    // 服务型命令关键词
    const serviceKeywords = [
      'nginx', 'httpd', 'apache', 'redis-server', 'postgres', 'mysqld', 'mongod',
      'gunicorn', 'uvicorn', 'celery', 'supervisord',
      'java -jar', 'java ', 'node server', 'npm start', 'yarn start',
      'python app', 'python -m', 'flask', 'django', 'fastapi',
      'server', 'listen', 'serve', 'start',
    ]

    const isServiceCommand = serviceKeywords.some(keyword => cmdArgs.includes(keyword))

    // 如果有 EXPOSE，也认为是服务型
    const hasExpose = finalInstructions.some(i => i.type === 'EXPOSE')

    if (isServiceCommand || hasExpose) {
      issues.push({
        id: 'X005',
        title: '长期服务缺少 HEALTHCHECK',
        message: '长期运行的服务建议添加 HEALTHCHECK 以便 Docker 监控健康状态',
        suggestion: '添加 HEALTHCHECK 指令，如 HEALTHCHECK CMD curl -f http://localhost/ || exit 1',
        severity: 'info',
        confidence: 'low',
        line: lastCmd.lineStart,
        stage: finalStage.alias,
        stageIndex: finalStage.index,
        category: 'best-practice',
      })
    }

    return issues
  },
}

// X006: 连续 RUN 指令合并建议
const ruleX006: Rule = {
  meta: {
    id: 'X006',
    name: '连续 RUN 指令合并建议',
    description: '连续的 RUN 指令可以合并以减少镜像层',
    category: 'best-practice',
    severity: 'info',
    confidence: 'low',
    appliesTo: ['RUN'],
    rationale: '每个 RUN 指令会创建一个新的镜像层。合并多个 RUN 指令可以减少镜像层数量，减小镜像体积。',
    examples: {
      bad: `FROM alpine:3.18
RUN apk add --no-cache curl
RUN apk add --no-cache wget
RUN rm -rf /var/cache/*`,
      good: `FROM alpine:3.18
RUN apk add --no-cache curl wget && \\
    rm -rf /var/cache/*`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const stage of ast.stages) {
      const stageInstructions = stage.instructions.map(i => ast.instructions[i])

      let consecutiveRuns: ParsedInstruction[] = []

      for (const inst of stageInstructions) {
        if (inst.type === 'RUN') {
          consecutiveRuns.push(inst)
        } else {
          if (consecutiveRuns.length > 1) {
            // 有连续的 RUN 指令
            for (let i = 0; i < consecutiveRuns.length - 1; i++) {
              issues.push({
                id: 'X006',
                title: '连续 RUN 指令合并建议',
                message: '连续的 RUN 指令可以合并以减少镜像层',
                suggestion: '使用 && 合并多个 RUN 指令',
                severity: 'info',
                confidence: 'low',
                line: consecutiveRuns[i].lineStart,
                instruction: 'RUN',
                stage: stage.alias,
                stageIndex: stage.index,
                category: 'best-practice',
              })
            }
          }
          consecutiveRuns = []
        }
      }

      // 处理末尾的连续 RUN
      if (consecutiveRuns.length > 1) {
        for (let i = 0; i < consecutiveRuns.length - 1; i++) {
          issues.push({
            id: 'X006',
            title: '连续 RUN 指令合并建议',
            message: '连续的 RUN 指令可以合并以减少镜像层',
            suggestion: '使用 && 合并多个 RUN 指令',
            severity: 'info',
            confidence: 'low',
            line: consecutiveRuns[i].lineStart,
            instruction: 'RUN',
            stage: stage.alias,
            stageIndex: stage.index,
            category: 'best-practice',
          })
        }
      }
    }

    return issues
  },
}

// X007: 连续空行过多
const ruleX007: Rule = {
  meta: {
    id: 'X007',
    name: '连续空行过多',
    description: '连续空行过多影响代码可读性',
    category: 'best-practice',
    severity: 'info',
    confidence: 'high',
    appliesTo: ['*'],
    rationale: '过多的连续空行会降低 Dockerfile 的可读性，建议保持最多 2 个连续空行。',
    examples: {
      bad: `FROM node:18-alpine




WORKDIR /app`,
      good: `FROM node:18-alpine

WORKDIR /app`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []
    let emptyLineCount = 0

    for (let i = 0; i < ast.lines.length; i++) {
      const line = ast.lines[i]
      if (line.trim() === '') {
        emptyLineCount++
      } else {
        if (emptyLineCount > 2) {
          issues.push({
            id: 'X007',
            title: '连续空行过多',
            message: `建议减少连续空行（当前 ${emptyLineCount} 行）`,
            suggestion: '保持最多 2 个连续空行',
            severity: 'info',
            confidence: 'high',
            line: i - emptyLineCount + 2, // 指向第一个多余空行
            category: 'best-practice',
          })
        }
        emptyLineCount = 0
      }
    }

    return issues
  },
}

// X011: USER + COPY 权限联动
const ruleX011: Rule = {
  meta: {
    id: 'X011',
    name: '非 root 用户 COPY 权限风险',
    description: '非 root 用户运行时 COPY 文件可能权限不足',
    category: 'security',
    severity: 'warning',
    confidence: 'medium',
    appliesTo: ['COPY'],
    rationale: '当容器以非 root 用户运行时，COPY 的文件默认属于 root 用户，可能导致运行时权限不足。建议使用 --chown 设置正确的文件所有者。',
    examples: {
      bad: `FROM node:18-alpine
WORKDIR /app
USER node
COPY . .
CMD ["node", "server.js"]`,
      good: `FROM node:18-alpine
WORKDIR /app
COPY --chown=node:node . .
USER node
CMD ["node", "server.js"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const stage of ast.stages) {
      const stageInstructions = stage.instructions.map(i => ast.instructions[i])

      // 找到最后的非 root USER
      let lastNonRootUser: { line: number; user: string } | null = null
      for (const inst of stageInstructions) {
        if (inst.type === 'USER') {
          const userArg = inst.args.trim().toLowerCase()
          if (userArg !== 'root' && userArg !== '0') {
            lastNonRootUser = { line: inst.lineStart, user: userArg }
          }
        }
      }

      // 如果没有非 root 用户，不触发
      if (!lastNonRootUser) continue

      // 检查 USER 之后是否有权限修复的 RUN chown/chmod
      let hasPermissionFix = false
      for (const inst of stageInstructions) {
        if (inst.type === 'RUN' && inst.lineStart > lastNonRootUser.line) {
          if (/chown|chmod/i.test(inst.args)) {
            hasPermissionFix = true
            break
          }
        }
      }

      // 检查 USER 之前的 COPY（到 WORKDIR 或应用目录）
      let workdir = '/app' // 默认 WORKDIR
      for (const inst of stageInstructions) {
        if (inst.type === 'WORKDIR' && inst.lineStart < lastNonRootUser.line) {
          workdir = inst.args.trim()
        }
      }

      // 找到设置非 root USER 之前的 COPY 指令
      for (const inst of stageInstructions) {
        if (inst.type !== 'COPY') continue
        if (inst.lineStart >= lastNonRootUser.line) continue // USER 之后的不检测

        // 已使用 --chown，不触发
        if (inst.flags.chown) continue

        // 检查目标是否是应用目录
        const args = inst.args
          .replace(/--from=\S+\s*/gi, '')
          .replace(/--chown=\S+\s*/gi, '')
          .trim()
        const parts = args.split(/\s+/)
        const target = parts[parts.length - 1]

        // 目标是 WORKDIR 或相对路径（应用目录）
        const isAppDirectory = target === '.' ||
          target === workdir ||
          target.startsWith(workdir) ||
          !target.startsWith('/') // 相对路径

        if (isAppDirectory && !hasPermissionFix) {
          issues.push({
            id: 'X011',
            title: '非 root 用户 COPY 权限风险',
            message: `非 root 用户 "${lastNonRootUser.user}" 运行时，COPY 的文件可能权限不足`,
            suggestion: `使用 COPY --chown=${lastNonRootUser.user}:${lastNonRootUser.user} 设置文件所有者`,
            severity: 'warning',
            confidence: 'medium',
            line: inst.lineStart,
            instruction: 'COPY',
            stage: stage.alias,
            stageIndex: stage.index,
            category: 'security',
          })
        }
      }
    }

    return issues
  },
}

// 导出所有跨指令规则
export const crossInstructionRules: Rule[] = [
  ruleX002,
  ruleX003,
  ruleX004,
  ruleX005,
  ruleX006,
  ruleX007,
  ruleX011,
]