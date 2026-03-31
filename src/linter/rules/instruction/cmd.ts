// ============================================
// CMD/ENTRYPOINT 指令规则
// ============================================

import { Rule, DockerfileAST, LintIssue } from '../../types'

// C001: JSON 数组单引号错误
const ruleC001: Rule = {
  meta: {
    id: 'C001',
    name: 'JSON 数组单引号错误',
    description: 'CMD/ENTRYPOINT 的 JSON 数组格式必须使用双引号',
    category: 'syntax',
    severity: 'error',
    confidence: 'high',
    appliesTo: ['CMD', 'ENTRYPOINT'],
    rationale: 'Dockerfile 的 JSON 数组格式遵循标准 JSON 规范，必须使用双引号，单引号会导致解析失败。',
    examples: {
      bad: `FROM node:18-alpine
CMD ['node', 'server.js']`,
      good: `FROM node:18-alpine
CMD ["node", "server.js"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'CMD' && inst.type !== 'ENTRYPOINT') continue

      const args = inst.normalizedArgs
      if (args.startsWith('[') && args.includes("'")) {
        issues.push({
          id: 'C001',
          title: 'JSON 数组单引号错误',
          message: `${inst.type} 的 JSON 数组格式必须使用双引号，不能使用单引号`,
          suggestion: '将单引号替换为双引号',
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

// C002: JSON 数组括号匹配
const ruleC002: Rule = {
  meta: {
    id: 'C002',
    name: 'JSON 数组括号匹配',
    description: 'CMD/ENTRYPOINT 的 JSON 数组括号必须匹配',
    category: 'syntax',
    severity: 'error',
    confidence: 'high',
    appliesTo: ['CMD', 'ENTRYPOINT'],
    rationale: '不匹配的括号会导致 Dockerfile 解析失败。',
    examples: {
      bad: `FROM node:18-alpine
CMD ["node", "server.js"`,
      good: `FROM node:18-alpine
CMD ["node", "server.js"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'CMD' && inst.type !== 'ENTRYPOINT') continue

      const args = inst.normalizedArgs
      if (args.startsWith('[')) {
        const openBrackets = (args.match(/\[/g) || []).length
        const closeBrackets = (args.match(/\]/g) || []).length

        if (openBrackets !== closeBrackets) {
          issues.push({
            id: 'C002',
            title: 'JSON 数组括号匹配',
            message: `${inst.type} 的 JSON 数组括号不匹配`,
            suggestion: '确保方括号数量匹配',
            severity: 'error',
            confidence: 'high',
            line: inst.lineStart,
            instruction: inst.type,
            stageIndex: inst.stageIndex,
            category: 'syntax',
          })
        }

        // 检查双引号匹配
        const doubleQuotes = (args.match(/"/g) || []).length
        if (doubleQuotes % 2 !== 0) {
          issues.push({
            id: 'C002',
            title: 'JSON 数组引号匹配',
            message: `${inst.type} 的 JSON 数组双引号不匹配`,
            suggestion: '确保双引号成对出现',
            severity: 'error',
            confidence: 'high',
            line: inst.lineStart,
            instruction: inst.type,
            stageIndex: inst.stageIndex,
            category: 'syntax',
          })
        }
      }
    }
    return issues
  },
}

// C003: shell form 警告
const ruleC003: Rule = {
  meta: {
    id: 'C003',
    name: 'shell form 警告',
    description: 'CMD/ENTRYPOINT 使用 shell 格式可能导致信号处理问题',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'medium',
    appliesTo: ['CMD', 'ENTRYPOINT'],
    rationale: 'shell form 会通过 /bin/sh -c 执行命令，导致应用成为 shell 的子进程，无法正确接收 SIGTERM 等信号。exec form（JSON 数组）可以让应用成为 PID 1，正确处理信号。',
    examples: {
      bad: `FROM node:18-alpine
CMD node server.js`,
      good: `FROM node:18-alpine
CMD ["node", "server.js"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'CMD' && inst.type !== 'ENTRYPOINT') continue

      const args = inst.normalizedArgs
      // 如果不是 JSON 数组格式，就是 shell form
      if (!args.startsWith('[')) {
        issues.push({
          id: 'C003',
          title: 'shell form 警告',
          message: `${inst.type} 使用 shell 格式可能导致信号处理问题，容器无法正确响应 SIGTERM`,
          suggestion: `使用 exec form: ${inst.type} ["command", "arg1"]`,
          severity: 'warning',
          confidence: 'medium',
          line: inst.lineStart,
          instruction: inst.type,
          stageIndex: inst.stageIndex,
          category: 'best-practice',
        })
      }
    }
    return issues
  },
}

// C004: 多个 CMD/ENTRYPOINT 警告
const ruleC004: Rule = {
  meta: {
    id: 'C004',
    name: '重复指令警告',
    description: '多个 CMD 或 ENTRYPOINT 只有最后一个会生效',
    category: 'syntax',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['CMD', 'ENTRYPOINT'],
    rationale: 'Dockerfile 中如果有多个 CMD 或 ENTRYPOINT，只有最后一个会生效，前面的会被覆盖。',
    examples: {
      bad: `FROM node:18-alpine
CMD ["node", "server.js"]
CMD ["npm", "start"]`,
      good: `FROM node:18-alpine
CMD ["npm", "start"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    // 按阶段检查
    for (const stage of ast.stages) {
      const cmdInstructions = stage.instructions
        .map(i => ast.instructions[i])
        .filter(i => i.type === 'CMD')

      const entrypointInstructions = stage.instructions
        .map(i => ast.instructions[i])
        .filter(i => i.type === 'ENTRYPOINT')

      // 多个 CMD
      if (cmdInstructions.length > 1) {
        for (let i = 0; i < cmdInstructions.length - 1; i++) {
          issues.push({
            id: 'C004',
            title: '重复 CMD 警告',
            message: '多个 CMD 指令，只有最后一个会生效',
            suggestion: '删除多余的 CMD 指令或合并命令',
            severity: 'warning',
            confidence: 'high',
            line: cmdInstructions[i].lineStart,
            instruction: 'CMD',
            stage: stage.alias,
            stageIndex: stage.index,
            category: 'syntax',
          })
        }
      }

      // 多个 ENTRYPOINT
      if (entrypointInstructions.length > 1) {
        for (let i = 0; i < entrypointInstructions.length - 1; i++) {
          issues.push({
            id: 'C004',
            title: '重复 ENTRYPOINT 警告',
            message: '多个 ENTRYPOINT 指令，只有最后一个会生效',
            suggestion: '删除多余的 ENTRYPOINT 指令或合并命令',
            severity: 'warning',
            confidence: 'high',
            line: entrypointInstructions[i].lineStart,
            instruction: 'ENTRYPOINT',
            stage: stage.alias,
            stageIndex: stage.index,
            category: 'syntax',
          })
        }
      }
    }
    return issues
  },
}

// C006: CMD + ENTRYPOINT 组合时 CMD 应为参数形式
const ruleC006: Rule = {
  meta: {
    id: 'C006',
    name: 'CMD + ENTRYPOINT 组合语义',
    description: '当 ENTRYPOINT 使用 exec form 时，CMD 应提供默认参数而非完整命令',
    category: 'semantic',
    severity: 'warning',
    confidence: 'medium',
    appliesTo: ['CMD', 'ENTRYPOINT'],
    rationale: '当 ENTRYPOINT 和 CMD 同时存在且 ENTRYPOINT 使用 exec form 时，CMD 的内容会作为 ENTRYPOINT 的参数传递。如果 CMD 提供完整命令而非参数，可能导致执行异常。',
    examples: {
      bad: `FROM node:18-alpine
ENTRYPOINT ["node"]
CMD ["npm", "start"]`,
      good: `FROM node:18-alpine
ENTRYPOINT ["node"]
CMD ["server.js"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const stage of ast.stages) {
      const stageInstructions = stage.instructions.map(i => ast.instructions[i])

      // 找到最后一个 ENTRYPOINT 和 CMD
      const lastEntrypoint = [...stageInstructions].reverse().find(i => i.type === 'ENTRYPOINT')
      const lastCmd = [...stageInstructions].reverse().find(i => i.type === 'CMD')

      if (!lastEntrypoint || !lastCmd) continue

      // ENTRYPOINT 是 exec form
      const entrypointArgs = lastEntrypoint.normalizedArgs
      const isEntrypointExecForm = entrypointArgs.startsWith('[')

      if (!isEntrypointExecForm) continue

      // CMD 是 exec form 但内容看起来像完整命令而非参数
      const cmdArgs = lastCmd.normalizedArgs
      if (!cmdArgs.startsWith('[')) continue

      // 检查 CMD 是否看起来像完整命令
      // 完整命令通常包含常见命令名，如 node、npm、python 等
      const cmdContent = cmdArgs.toLowerCase()
      const fullCommandPatterns = [
        '"node"', '"npm"', '"yarn"', '"python"', '"python3"', '"java"',
        '"ruby"', '"perl"', '"sh"', '"bash"', '"curl"', '"wget"',
      ]

      for (const pattern of fullCommandPatterns) {
        if (cmdContent.includes(pattern)) {
          issues.push({
            id: 'C006',
            title: 'CMD + ENTRYPOINT 组合语义',
            message: 'ENTRYPOINT exec form 时，CMD 应提供默认参数而非完整命令',
            suggestion: 'CMD 应作为 ENTRYPOINT 的参数，如 ENTRYPOINT ["node"] CMD ["server.js"]',
            severity: 'warning',
            confidence: 'medium',
            line: lastCmd.lineStart,
            instruction: 'CMD',
            stage: stage.alias,
            stageIndex: stage.index,
            category: 'semantic',
          })
          break
        }
      }
    }

    return issues
  },
}

// C007: ENTRYPOINT shell form + CMD exec form 组合警告
const ruleC007: Rule = {
  meta: {
    id: 'C007',
    name: 'ENTRYPOINT shell form + CMD 组合警告',
    description: 'ENTRYPOINT 使用 shell form 时，CMD 无法正确传递参数',
    category: 'semantic',
    severity: 'warning',
    confidence: 'medium',
    appliesTo: ['CMD', 'ENTRYPOINT'],
    rationale: '当 ENTRYPOINT 使用 shell form 时，CMD 的内容会被忽略或无法正确传递给 ENTRYPOINT，导致组合无法按预期工作。',
    examples: {
      bad: `FROM node:18-alpine
ENTRYPOINT node server.js
CMD ["--port", "3000"]`,
      good: `FROM node:18-alpine
ENTRYPOINT ["node", "server.js"]
CMD ["--port", "3000"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const stage of ast.stages) {
      const stageInstructions = stage.instructions.map(i => ast.instructions[i])

      // 找到最后一个 ENTRYPOINT 和 CMD
      const lastEntrypoint = [...stageInstructions].reverse().find(i => i.type === 'ENTRYPOINT')
      const lastCmd = [...stageInstructions].reverse().find(i => i.type === 'CMD')

      if (!lastEntrypoint || !lastCmd) continue

      // ENTRYPOINT 是 shell form
      const entrypointArgs = lastEntrypoint.normalizedArgs
      const isEntrypointShellForm = !entrypointArgs.startsWith('[')

      if (!isEntrypointShellForm) continue

      // CMD 是 exec form
      const cmdArgs = lastCmd.normalizedArgs
      const isCmdExecForm = cmdArgs.startsWith('[')

      if (!isCmdExecForm) continue

      // ENTRYPOINT shell form + CMD exec form 组合警告
      issues.push({
        id: 'C007',
        title: 'ENTRYPOINT shell form + CMD 组合警告',
        message: 'ENTRYPOINT 使用 shell form 时，CMD 的参数无法正确传递',
        suggestion: '将 ENTRYPOINT 改为 exec form，或使用 shell form CMD',
        severity: 'warning',
        confidence: 'medium',
        line: lastEntrypoint.lineStart,
        instruction: 'ENTRYPOINT',
        stage: stage.alias,
        stageIndex: stage.index,
        category: 'semantic',
      })
    }

    return issues
  },
}

// 导出所有 CMD/ENTRYPOINT 规则
export const cmdRules: Rule[] = [
  ruleC001,
  ruleC002,
  ruleC003,
  ruleC004,
  ruleC006,
  ruleC007,
]