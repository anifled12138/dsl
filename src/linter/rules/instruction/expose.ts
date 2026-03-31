// ============================================
// EXPOSE 指令规则
// ============================================

import { Rule, DockerfileAST, LintIssue } from '../../types'

// 合法的端口范围
const MIN_PORT = 1
const MAX_PORT = 65535

// 合法的协议
const VALID_PROTOCOLS = ['tcp', 'udp']

// 解析端口参数
function parsePortSpec(arg: string): { port: number | null; protocol: string | null; portError?: string; protocolError?: string } {
  const trimmed = arg.trim()

  // 格式: port 或 port/protocol
  const match = trimmed.match(/^(\d+)(?:\/([a-zA-Z]+))?$/)

  if (!match) {
    return { port: null, protocol: null, portError: '端口格式无效' }
  }

  const portNum = parseInt(match[1], 10)
  const protocol = match[2] ? match[2].toLowerCase() : null

  const result: { port: number | null; protocol: string | null; portError?: string; protocolError?: string } = {
    port: portNum,
    protocol,
  }

  // 检查端口范围
  if (portNum < MIN_PORT || portNum > MAX_PORT) {
    result.portError = `端口 ${portNum} 超出有效范围 (${MIN_PORT}-${MAX_PORT})`
  }

  // 检查协议（分开处理）
  if (protocol && !VALID_PROTOCOLS.includes(protocol)) {
    result.protocolError = `协议 "${protocol}" 无效，有效协议: ${VALID_PROTOCOLS.join(', ')}`
  }

  return result
}

// EX001: 非法端口
const ruleEX001: Rule = {
  meta: {
    id: 'EX001',
    name: 'EXPOSE 端口合法性',
    description: 'EXPOSE 的端口必须在 1-65535 范围内',
    category: 'syntax',
    severity: 'error',
    confidence: 'high',
    appliesTo: ['EXPOSE'],
    rationale: '有效的端口号必须在 1-65535 范围内。超出范围的端口号会导致 Dockerfile 解析错误或运行时问题。',
    examples: {
      bad: `FROM nginx:alpine
EXPOSE 80/tcp
EXPOSE 99999`,
      good: `FROM nginx:alpine
EXPOSE 80/tcp
EXPOSE 443`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'EXPOSE') continue

      const args = inst.args.trim()
      if (!args) continue

      // 分割多个端口（空格分隔）
      const portSpecs = args.split(/\s+/)

      for (const spec of portSpecs) {
        const result = parsePortSpec(spec)
        // EX001 只处理端口格式和范围错误，不处理协议错误
        if (result.portError) {
          issues.push({
            id: 'EX001',
            title: 'EXPOSE 端口合法性',
            message: result.portError,
            suggestion: `使用有效端口范围 (${MIN_PORT}-${MAX_PORT})，如 EXPOSE 80`,
            severity: 'error',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'EXPOSE',
            category: 'syntax',
          })
        }
      }
    }

    return issues
  },
}

// EX002: 重复端口暴露
const ruleEX002: Rule = {
  meta: {
    id: 'EX002',
    name: 'EXPOSE 重复端口',
    description: '同一端口不应被多次 EXPOSE',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['EXPOSE'],
    rationale: '重复暴露同一端口是不必要的，虽然不会导致错误，但会降低 Dockerfile 的可读性。',
    examples: {
      bad: `FROM nginx:alpine
EXPOSE 80
EXPOSE 80/tcp`,
      good: `FROM nginx:alpine
EXPOSE 80/tcp 443/tcp`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []
    const exposedPorts = new Map<string, number>() // port/protocol -> line

    for (const inst of ast.instructions) {
      if (inst.type !== 'EXPOSE') continue

      const args = inst.args.trim()
      if (!args) continue

      const portSpecs = args.split(/\s+/)

      for (const spec of portSpecs) {
        const result = parsePortSpec(spec)
        // 跳过有端口错误的（无效端口不应检查重复）
        if (result.portError || result.port === null) continue

        // 规范化端口标识（统一处理有无协议的情况）
        const portId = result.port.toString()
        const portWithProtocol = `${result.port}/${result.protocol || 'tcp'}`

        // 检查重复
        // 如果之前暴露了 80，现在又暴露 80/tcp，也算重复
        if (exposedPorts.has(portId) || exposedPorts.has(portWithProtocol)) {
          const prevLine = exposedPorts.get(portId) || exposedPorts.get(portWithProtocol)
          issues.push({
            id: 'EX002',
            title: 'EXPOSE 重复端口',
            message: `端口 ${result.port} 已在第 ${prevLine} 行暴露`,
            suggestion: '删除重复的 EXPOSE 指令，或合并到一行',
            severity: 'warning',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'EXPOSE',
            category: 'best-practice',
          })
        } else {
          exposedPorts.set(portId, inst.lineStart)
          exposedPorts.set(portWithProtocol, inst.lineStart)
        }
      }
    }

    return issues
  },
}

// EX003: TCP/UDP 语法检查
const ruleEX003: Rule = {
  meta: {
    id: 'EX003',
    name: 'EXPOSE 协议语法',
    description: 'EXPOSE 端口协议只能是 tcp 或 udp',
    category: 'syntax',
    severity: 'error',
    confidence: 'high',
    appliesTo: ['EXPOSE'],
    rationale: 'Docker 只支持 TCP 和 UDP 协议。使用其他协议名称会导致错误。',
    examples: {
      bad: `FROM nginx:alpine
EXPOSE 80/http
EXPOSE 443/sctp`,
      good: `FROM nginx:alpine
EXPOSE 80/tcp
EXPOSE 53/udp`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'EXPOSE') continue

      const args = inst.args.trim()
      if (!args) continue

      const portSpecs = args.split(/\s+/)

      for (const spec of portSpecs) {
        const result = parsePortSpec(spec)

        // EX003 只处理协议错误
        if (result.protocolError) {
          issues.push({
            id: 'EX003',
            title: 'EXPOSE 协议语法错误',
            message: result.protocolError,
            suggestion: '使用 tcp 或 udp 协议，如 EXPOSE 80/tcp',
            severity: 'error',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'EXPOSE',
            category: 'syntax',
          })
        }
      }
    }

    return issues
  },
}

// 导出所有 EXPOSE 规则
export const exposeRules: Rule[] = [
  ruleEX001,
  ruleEX002,
  ruleEX003,
]