// ============================================
// RUN 指令规则
// ============================================

import { Rule, DockerfileAST, LintIssue } from '../../types'
import { shouldSuppressPipeCommand, shouldSuppressRunCommand } from '../../suppression'

// R001: curl|bash / wget|sh 安全警告
const ruleR001: Rule = {
  meta: {
    id: 'R001',
    name: '远程管道执行警告',
    description: '直接从网络下载并执行脚本存在供应链攻击风险',
    category: 'security',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['RUN'],
    rationale: '使用 curl | bash 或 wget | sh 直接执行远程脚本时，无法验证脚本内容，存在供应链攻击风险。建议先下载、验证哈希值后再执行。',
    examples: {
      bad: `FROM alpine:3.18
RUN curl https://example.com/script.sh | bash`,
      good: `FROM alpine:3.18
RUN curl -o /tmp/script.sh https://example.com/script.sh && \\
    echo "expected-sha256-hash  /tmp/script.sh" | sha256sum -c && \\
    bash /tmp/script.sh && \\
    rm /tmp/script.sh`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'RUN') continue

      const args = inst.normalizedArgs

      // 检测 curl | bash/sh
      if (/curl.*\|\s*(bash|sh)\b/i.test(args)) {
        const suppression = shouldSuppressPipeCommand(ast, inst, args)
        if (!suppression.suppressed) {
          issues.push({
            id: 'R001',
            title: '远程管道执行警告',
            message: '直接从网络下载并执行脚本存在供应链攻击风险',
            suggestion: '先下载脚本，验证哈希值后再执行',
            severity: 'warning',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'RUN',
            stageIndex: inst.stageIndex,
            category: 'security',
          })
        }
      }

      // 检测 wget | sh/bash
      if (/wget.*\|\s*(bash|sh)\b/i.test(args)) {
        const suppression = shouldSuppressPipeCommand(ast, inst, args)
        if (!suppression.suppressed) {
          issues.push({
            id: 'R001',
            title: '远程管道执行警告',
            message: '直接从网络下载并执行脚本存在供应链攻击风险',
            suggestion: '先下载脚本，验证哈希值后再执行',
            severity: 'warning',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'RUN',
            stageIndex: inst.stageIndex,
            category: 'security',
          })
        }
      }
    }
    return issues
  },
}

// R002: sudo 使用警告
const ruleR002: Rule = {
  meta: {
    id: 'R002',
    name: 'sudo 使用警告',
    description: '容器内应使用 USER 指令切换用户，而非 sudo',
    category: 'security',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['RUN'],
    rationale: '使用 sudo 需要安装 sudo 包，增加镜像大小和攻击面。推荐使用 USER 指令在需要时切换到 root 用户。',
    examples: {
      bad: `FROM ubuntu:20.04
RUN apt-get update && sudo apt-get install -y curl`,
      good: `FROM ubuntu:20.04
USER root
RUN apt-get update && apt-get install -y curl
USER appuser`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'RUN') continue

      const args = inst.normalizedArgs
      if (/\bsudo\b/.test(args)) {
        const suppression = shouldSuppressRunCommand(ast, inst, 'sudo')
        if (!suppression.suppressed) {
          issues.push({
            id: 'R002',
            title: 'sudo 使用警告',
            message: '不建议在容器内使用 sudo，应使用 USER 指令切换用户',
            suggestion: '使用 USER root 切换到 root 用户执行命令',
            severity: 'warning',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'RUN',
            stageIndex: inst.stageIndex,
            category: 'security',
          })
        }
      }
    }
    return issues
  },
}

// R003: apt-get update 单独运行
const ruleR003: Rule = {
  meta: {
    id: 'R003',
    name: 'apt-get update 应与 install 合并',
    description: '单独的 apt-get update 会被 Docker 缓存，导致后续 install 使用过期索引',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['RUN'],
    rationale: 'Docker 会缓存每个 RUN 指令的结果。如果 apt-get update 和 apt-get install 分开，缓存可能导致 install 使用过期的包索引。',
    examples: {
      bad: `FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install -y curl`,
      good: `FROM ubuntu:20.04
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []
    const runInstructions = ast.instructions.filter(i => i.type === 'RUN')

    for (let i = 0; i < runInstructions.length; i++) {
      const inst = runInstructions[i]
      const args = inst.normalizedArgs

      // 检测单独的 apt-get update（后面没有 && apt-get install）
      if (/\bapt-get\s+update\b/i.test(args)) {
        // 检查是否有后续的 apt-get install
        const hasNextInstall = runInstructions
          .slice(i + 1)
          .some(next => /\bapt-get\s+install\b/i.test(next.normalizedArgs))

        // 当前命令是否同时包含 install
        const hasInstallInSameLine = /\bapt-get\s+install\b/i.test(args)

        if (hasNextInstall && !hasInstallInSameLine) {
          issues.push({
            id: 'R003',
            title: 'apt-get update 应与 install 合并',
            message: '单独的 apt-get update 会被缓存，导致后续 install 使用过期索引',
            suggestion: '将 apt-get update 和 apt-get install 合并在同一个 RUN 指令中',
            severity: 'warning',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'RUN',
            stageIndex: inst.stageIndex,
            category: 'best-practice',
          })
        }
      }
    }
    return issues
  },
}

// R004: apt-get install 缓存清理
const ruleR004: Rule = {
  meta: {
    id: 'R004',
    name: 'apt-get install 缓存清理',
    description: 'apt-get install 后应清理缓存以减小镜像大小',
    category: 'best-practice',
    severity: 'info',
    confidence: 'high',
    appliesTo: ['RUN'],
    rationale: 'apt-get 安装后会在 /var/lib/apt/lists/ 保留缓存，清理它可以减小镜像体积。',
    examples: {
      bad: `FROM ubuntu:20.04
RUN apt-get update && apt-get install -y curl`,
      good: `FROM ubuntu:20.04
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'RUN') continue

      const args = inst.normalizedArgs
      if (/\bapt-get\s+install\b/i.test(args)) {
        if (!/rm\s+(-rf|--recursive|--force)\s+.*\/var\/lib\/apt\/lists/i.test(args)) {
          issues.push({
            id: 'R004',
            title: 'apt-get install 缓存清理',
            message: 'apt-get install 后建议清理缓存: rm -rf /var/lib/apt/lists/*',
            suggestion: '在 apt-get install 后添加 && rm -rf /var/lib/apt/lists/*',
            severity: 'info',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'RUN',
            stageIndex: inst.stageIndex,
            category: 'best-practice',
          })
        }
      }
    }
    return issues
  },
}

// R005: apt-get install -y 标志
const ruleR005: Rule = {
  meta: {
    id: 'R005',
    name: 'apt-get install 应使用 -y 标志',
    description: 'apt-get install 在非交互环境需要 -y 标志自动确认',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['RUN'],
    rationale: 'Docker 构建是非交互式的，没有 -y 标志 apt-get install 会等待用户确认导致构建失败。',
    examples: {
      bad: `FROM ubuntu:20.04
RUN apt-get update && apt-get install curl`,
      good: `FROM ubuntu:20.04
RUN apt-get update && apt-get install -y curl`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'RUN') continue

      const args = inst.normalizedArgs
      const aptInstallMatch = args.match(/\bapt-get\s+install\b/i)
      if (aptInstallMatch) {
        // 检查是否有 -y 或 --yes 标志
        if (!/\bapt-get\s+install\s+.*(-y|--yes|--assume-yes)\b/i.test(args)) {
          issues.push({
            id: 'R005',
            title: 'apt-get install 应使用 -y 标志',
            message: 'apt-get install 在非交互环境需要 -y 标志自动确认',
            suggestion: '添加 -y 标志: apt-get install -y package',
            severity: 'warning',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'RUN',
            stageIndex: inst.stageIndex,
            category: 'best-practice',
          })
        }
      }
    }
    return issues
  },
}

// R006: apk add --no-cache
const ruleR006: Rule = {
  meta: {
    id: 'R006',
    name: 'apk add 应使用 --no-cache',
    description: 'apk add 使用 --no-cache 可以减小镜像大小',
    category: 'best-practice',
    severity: 'info',
    confidence: 'high',
    appliesTo: ['RUN'],
    rationale: 'Alpine 的 apk 默认会缓存索引和包，使用 --no-cache 可以避免创建缓存，减小镜像体积。',
    examples: {
      bad: `FROM alpine:3.18
RUN apk add curl`,
      good: `FROM alpine:3.18
RUN apk add --no-cache curl`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'RUN') continue

      const args = inst.normalizedArgs
      if (/\bapk\s+add\b/i.test(args)) {
        if (!/--no-cache\b/i.test(args)) {
          issues.push({
            id: 'R006',
            title: 'apk add 应使用 --no-cache',
            message: 'apk add 建议使用 --no-cache 参数减小镜像大小',
            suggestion: '使用 apk add --no-cache package',
            severity: 'info',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'RUN',
            stageIndex: inst.stageIndex,
            category: 'best-practice',
          })
        }
      }
    }
    return issues
  },
}

// R007: rm -rf / 警告
const ruleR007: Rule = {
  meta: {
    id: 'R007',
    name: '危险删除命令警告',
    description: 'rm -rf / 或 rm -rf /* 可能意外删除系统文件',
    category: 'security',
    severity: 'warning',
    confidence: 'medium',
    appliesTo: ['RUN'],
    rationale: 'rm -rf / 或 rm -rf /* 是极其危险的命令，可能删除整个文件系统或导致不可预期的结果。',
    examples: {
      bad: `FROM alpine:3.18
RUN rm -rf /`,
      good: `FROM alpine:3.18
RUN rm -rf /tmp/* /var/cache/*`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'RUN') continue

      const args = inst.normalizedArgs
      // 检测 rm -rf / 或 rm -rf /*
      if (/rm\s+(-rf|-fr)\s+\/(\s|$|\*)/.test(args)) {
        issues.push({
          id: 'R007',
          title: '危险删除命令警告',
          message: 'rm -rf / 或 rm -rf /* 可能意外删除系统文件',
          suggestion: '指定具体要删除的路径，如 rm -rf /tmp/*',
          severity: 'warning',
          confidence: 'medium',
          line: inst.lineStart,
          instruction: 'RUN',
          stageIndex: inst.stageIndex,
          category: 'security',
        })
      }
    }
    return issues
  },
}

// R008: chmod 777 警告
const ruleR008: Rule = {
  meta: {
    id: 'R008',
    name: 'chmod 777 警告',
    description: 'chmod 777 给所有用户完全权限，存在安全风险',
    category: 'security',
    severity: 'warning',
    confidence: 'medium',
    appliesTo: ['RUN'],
    rationale: 'chmod 777 允许任何用户读写执行，这违反了最小权限原则，可能被恶意利用。',
    examples: {
      bad: `FROM alpine:3.18
RUN chmod 777 /app`,
      good: `FROM alpine:3.18
RUN chmod 755 /app`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'RUN') continue

      const args = inst.normalizedArgs
      if (/chmod\s+(-R\s+)?777\b/.test(args)) {
        issues.push({
          id: 'R008',
          title: 'chmod 777 警告',
          message: 'chmod 777 给所有用户完全权限，存在安全风险',
          suggestion: '使用更严格的权限，如 chmod 755 或 chmod 750',
          severity: 'warning',
          confidence: 'medium',
          line: inst.lineStart,
          instruction: 'RUN',
          stageIndex: inst.stageIndex,
          category: 'security',
        })
      }
    }
    return issues
  },
}

// R009: cd 命令应使用 WORKDIR
const ruleR009: Rule = {
  meta: {
    id: 'R009',
    name: 'cd 命令应使用 WORKDIR',
    description: 'RUN 中的 cd 命令应改用 WORKDIR 指令',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'medium',
    appliesTo: ['RUN'],
    rationale: 'WORKDIR 指令会创建目录（如果不存在）并设置工作目录，比 cd 命令更清晰且会影响后续指令。',
    examples: {
      bad: `FROM node:18-alpine
RUN cd /app && npm install`,
      good: `FROM node:18-alpine
WORKDIR /app
RUN npm install`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'RUN') continue

      const args = inst.normalizedArgs
      // 检测 cd 命令（但排除 cd && 的合理用法）
      if (/\bcd\s+\S+/.test(args)) {
        // 如果 cd 是第一个命令且后面有 &&，可能是在设置工作目录
        const cdMatch = args.match(/^\s*cd\s+(\S+)\s+&&/)
        if (cdMatch) {
          issues.push({
            id: 'R009',
            title: 'cd 命令应使用 WORKDIR',
            message: 'RUN 中的 cd 命令应改用 WORKDIR 指令',
            suggestion: `使用 WORKDIR ${cdMatch[1]} 替代 cd 命令`,
            severity: 'warning',
            confidence: 'medium',
            line: inst.lineStart,
            instruction: 'RUN',
            stageIndex: inst.stageIndex,
            category: 'best-practice',
          })
        }
      }
    }
    return issues
  },
}

// R010: yum install 缺少 -y
const ruleR010: Rule = {
  meta: {
    id: 'R010',
    name: 'yum install 应使用 -y 标志',
    description: 'yum install 在非交互环境需要 -y 标志自动确认',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['RUN'],
    rationale: 'Docker 构建是非交互式的，没有 -y 标志 yum install 会等待用户确认导致构建失败。',
    examples: {
      bad: `FROM centos:7
RUN yum install curl`,
      good: `FROM centos:7
RUN yum install -y curl && yum clean all`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'RUN') continue

      const args = inst.normalizedArgs
      if (/\byum\s+install\b/i.test(args)) {
        if (!/\byum\s+install\s+.*-y\b/i.test(args)) {
          issues.push({
            id: 'R010',
            title: 'yum install 应使用 -y 标志',
            message: 'yum install 在非交互环境需要 -y 标志自动确认',
            suggestion: '添加 -y 标志: yum install -y package',
            severity: 'warning',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'RUN',
            stageIndex: inst.stageIndex,
            category: 'best-practice',
          })
        }
      }
    }
    return issues
  },
}

// R011: yum/dnf 安装后未清理缓存
const ruleR011: Rule = {
  meta: {
    id: 'R011',
    name: 'yum/dnf 缓存清理',
    description: 'yum/dnf install 后应清理缓存以减小镜像大小',
    category: 'best-practice',
    severity: 'info',
    confidence: 'high',
    appliesTo: ['RUN'],
    rationale: 'yum/dnf 安装后会在缓存目录保留包文件，清理它可以减小镜像体积。',
    examples: {
      bad: `FROM centos:7
RUN yum install -y curl`,
      good: `FROM centos:7
RUN yum install -y curl && yum clean all`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'RUN') continue

      const args = inst.normalizedArgs
      if (/\b(yum|dnf)\s+install\b/i.test(args)) {
        if (!/\b(yum|dnf)\s+clean\s+all\b/i.test(args)) {
          issues.push({
            id: 'R011',
            title: 'yum/dnf 缓存清理',
            message: 'yum/dnf install 后建议清理缓存',
            suggestion: '添加 yum clean all 或 dnf clean all',
            severity: 'info',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'RUN',
            stageIndex: inst.stageIndex,
            category: 'best-practice',
          })
        }
      }
    }
    return issues
  },
}

// R012: dnf/microdnf install 缺少 -y
const ruleR012: Rule = {
  meta: {
    id: 'R012',
    name: 'dnf/microdnf install 应使用 -y 标志',
    description: 'dnf/microdnf install 在非交互环境需要 -y 标志自动确认',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['RUN'],
    rationale: 'Docker 构建是非交互式的，没有 -y 标志 dnf/microdnf install 会等待用户确认导致构建失败。',
    examples: {
      bad: `FROM fedora:38
RUN dnf install curl`,
      good: `FROM fedora:38
RUN dnf install -y curl && dnf clean all`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'RUN') continue

      const args = inst.normalizedArgs
      if (/\b(dnf|microdnf)\s+install\b/i.test(args)) {
        if (!/\b(dnf|microdnf)\s+install\s+.*-y\b/i.test(args)) {
          issues.push({
            id: 'R012',
            title: 'dnf/microdnf install 应使用 -y 标志',
            message: 'dnf/microdnf install 在非交互环境需要 -y 标志自动确认',
            suggestion: '添加 -y 标志: dnf install -y package',
            severity: 'warning',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'RUN',
            stageIndex: inst.stageIndex,
            category: 'best-practice',
          })
        }
      }
    }
    return issues
  },
}

// 导出所有 RUN 规则
export const runRules: Rule[] = [
  ruleR001,
  ruleR002,
  ruleR003,
  ruleR004,
  ruleR005,
  ruleR006,
  ruleR007,
  ruleR008,
  ruleR009,
  ruleR010,
  ruleR011,
  ruleR012,
]