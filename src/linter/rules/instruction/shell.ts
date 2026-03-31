// ============================================
// SHELL/STOPSIGNAL 指令规则
// ============================================

import { Rule, DockerfileAST, LintIssue } from '../../types'

// 有效的信号名称列表
const VALID_SIGNALS = [
  'SIGABRT', 'SIGALRM', 'SIGBUS', 'SIGCHLD', 'SIGCONT', 'SIGFPE',
  'SIGHUP', 'SIGILL', 'SIGINT', 'SIGIO', 'SIGKILL', 'SIGPIPE',
  'SIGPROF', 'SIGPWR', 'SIGQUIT', 'SIGSEGV', 'SIGSTKFLT', 'SIGSTOP',
  'SIGSYS', 'SIGTERM', 'SIGTRAP', 'SIGTSTP', 'SIGTTIN', 'SIGTTOU',
  'SIGURG', 'SIGUSR1', 'SIGUSR2', 'SIGVTALRM', 'SIGWINCH', 'SIGXCPU',
  'SIGXFSZ',
]

// S001: SHELL 参数格式合法性
const ruleS001: Rule = {
  meta: {
    id: 'S001',
    name: 'SHELL 格式合法性',
    description: 'SHELL 指令必须使用 JSON 数组形式',
    category: 'syntax',
    severity: 'error',
    confidence: 'high',
    appliesTo: ['SHELL'],
    rationale: 'SHELL 指令必须使用 exec form（JSON 数组格式），否则会导致 Dockerfile 解析失败。',
    examples: {
      bad: `FROM node:18-alpine
SHELL cmd /S /C`,
      good: `FROM node:18-alpine
SHELL ["cmd", "/S", "/C"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'SHELL') continue

      const args = inst.normalizedArgs

      // 必须是 JSON 数组格式
      if (!args.startsWith('[')) {
        issues.push({
          id: 'S001',
          title: 'SHELL 格式错误',
          message: 'SHELL 指令必须使用 JSON 数组形式',
          suggestion: '使用 exec form: SHELL ["cmd", "/S", "/C"]',
          severity: 'error',
          confidence: 'high',
          line: inst.lineStart,
          instruction: 'SHELL',
          stageIndex: inst.stageIndex,
          category: 'syntax',
        })
        continue
      }

      // 检查 JSON 数组格式是否正确
      const openBrackets = (args.match(/\[/g) || []).length
      const closeBrackets = (args.match(/\]/g) || []).length

      if (openBrackets !== closeBrackets) {
        issues.push({
          id: 'S001',
          title: 'SHELL 括号不匹配',
          message: 'SHELL 的 JSON 数组括号不匹配',
          suggestion: '确保方括号数量匹配',
          severity: 'error',
          confidence: 'high',
          line: inst.lineStart,
          instruction: 'SHELL',
          stageIndex: inst.stageIndex,
          category: 'syntax',
        })
      }

      // 检查双引号匹配
      const doubleQuotes = (args.match(/"/g) || []).length
      if (doubleQuotes % 2 !== 0) {
        issues.push({
          id: 'S001',
          title: 'SHELL 引号不匹配',
          message: 'SHELL 的 JSON 数组双引号不匹配',
          suggestion: '确保双引号成对出现',
          severity: 'error',
          confidence: 'high',
          line: inst.lineStart,
          instruction: 'SHELL',
          stageIndex: inst.stageIndex,
          category: 'syntax',
        })
      }

      // 检查是否使用单引号
      if (args.includes("'")) {
        issues.push({
          id: 'S001',
          title: 'SHELL 单引号错误',
          message: 'SHELL 的 JSON 数组必须使用双引号，不能使用单引号',
          suggestion: '将单引号替换为双引号',
          severity: 'error',
          confidence: 'high',
          line: inst.lineStart,
          instruction: 'SHELL',
          stageIndex: inst.stageIndex,
          category: 'syntax',
        })
      }
    }

    return issues
  },
}

// ST001: STOPSIGNAL 值合法性
const ruleST001: Rule = {
  meta: {
    id: 'ST001',
    name: 'STOPSIGNAL 值合法性',
    description: 'STOPSIGNAL 值必须是有效的信号名称或数字',
    category: 'syntax',
    severity: 'error',
    confidence: 'high',
    appliesTo: ['STOPSIGNAL'],
    rationale: '无效的 STOPSIGNAL 值会导致容器无法正确响应停止信号，影响容器的优雅关闭。',
    examples: {
      bad: `FROM node:18-alpine
STOPSIGNAL invalid`,
      good: `FROM node:18-alpine
STOPSIGNAL SIGTERM`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'STOPSIGNAL') continue

      const args = inst.normalizedArgs.trim()

      // 空值检查
      if (args === '') {
        issues.push({
          id: 'ST001',
          title: 'STOPSIGNAL 值缺失',
          message: 'STOPSIGNAL 需要指定信号值',
          suggestion: '添加有效的信号值，如 SIGTERM 或 15',
          severity: 'error',
          confidence: 'high',
          line: inst.lineStart,
          instruction: 'STOPSIGNAL',
          stageIndex: inst.stageIndex,
          category: 'syntax',
        })
        continue
      }

      // 检查是否是数字（信号编号）
      const signalNum = parseInt(args, 10)
      if (!isNaN(signalNum)) {
        // 信号编号范围检查（通常 1-64）
        if (signalNum < 1 || signalNum > 64) {
          issues.push({
            id: 'ST001',
            title: 'STOPSIGNAL 数字无效',
            message: `信号编号 ${signalNum} 不在有效范围 (1-64)`,
            suggestion: '使用有效的信号编号，如 15 (SIGTERM)',
            severity: 'error',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'STOPSIGNAL',
            stageIndex: inst.stageIndex,
            category: 'syntax',
          })
        }
        continue // 数字有效，不继续检查
      }

      // 检查是否是有效的信号名称
      const upperArgs = args.toUpperCase()
      if (!VALID_SIGNALS.includes(upperArgs)) {
        issues.push({
          id: 'ST001',
          title: 'STOPSIGNAL 名称无效',
          message: `"${args}" 不是有效的信号名称`,
          suggestion: `使用有效的信号名称，如 SIGTERM、SIGINT 或信号编号`,
          severity: 'error',
          confidence: 'high',
          line: inst.lineStart,
          instruction: 'STOPSIGNAL',
          stageIndex: inst.stageIndex,
          category: 'syntax',
        })
      }
    }

    return issues
  },
}

// 导出所有 SHELL/STOPSIGNAL 规则
export const shellRules: Rule[] = [
  ruleS001,
  ruleST001,
]