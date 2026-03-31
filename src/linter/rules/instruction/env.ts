// ============================================
// ENV 指令规则
// ============================================

import { Rule, DockerfileAST, LintIssue } from '../../types'

// 敏感信息关键词模式
const SECRET_PATTERNS = [
  // 密码相关
  { pattern: /password/i, name: 'PASSWORD' },
  { pattern: /passwd/i, name: 'PASSWD' },
  { pattern: /pwd(?![a-z])/i, name: 'PWD' },
  // 密钥/令牌相关
  { pattern: /secret[-_]?key/i, name: 'SECRET_KEY' },
  { pattern: /secret(?![-_]?key)/i, name: 'SECRET' },
  { pattern: /token/i, name: 'TOKEN' },
  { pattern: /api[-_]?key/i, name: 'API_KEY' },
  { pattern: /apikey/i, name: 'APIKEY' },
  { pattern: /private[-_]?key/i, name: 'PRIVATE_KEY' },
  { pattern: /privatekey/i, name: 'PRIVATEKEY' },
  { pattern: /credential/i, name: 'CREDENTIAL' },
  { pattern: /creds/i, name: 'CREDS' },
  // AWS 相关
  { pattern: /aws[-_]?access[-_]?key/i, name: 'AWS_ACCESS_KEY' },
  { pattern: /aws[-_]?secret/i, name: 'AWS_SECRET' },
  // 数据库相关
  { pattern: /database[-_]?url/i, name: 'DATABASE_URL' },
  { pattern: /db[-_]?password/i, name: 'DB_PASSWORD' },
  // 认证相关
  { pattern: /auth[-_]?token/i, name: 'AUTH_TOKEN' },
  { pattern: /access[-_]?token/i, name: 'ACCESS_TOKEN' },
]

// 检查值是否是变量引用（不应触发）
function isVariableReference(value: string): boolean {
  // ${VAR} 或 $VAR 格式
  return /^\$\{?[A-Za-z_][A-Za-z0-9_]*\}?$/.test(value.trim())
}

// 检查值是否是示例字符串（不应触发）
function isExampleValue(value: string): boolean {
  const lowerValue = value.toLowerCase()
  const examplePatterns = [
    /your[-_]/i,
    /<[^>]+>/,
    /^xxx+$/i,
    /example|sample|demo|placeholder/i,
    /change[-_]?me/i,
    /^""$/,
  ]

  for (const pattern of examplePatterns) {
    if (pattern.test(lowerValue)) {
      return true
    }
  }
  return false
}

// 检查值是否为空
function isEmptyValue(value: string): boolean {
  return value.trim() === '' || value.trim() === '""' || value.trim() === "''"
}

// E001: ENV 中的敏感信息检测
const ruleE001: Rule = {
  meta: {
    id: 'E001',
    name: 'ENV 敏感信息检测',
    description: 'ENV 指令中不应包含密码、密钥等敏感信息',
    category: 'security',
    severity: 'security',
    confidence: 'high',
    appliesTo: ['ENV'],
    rationale: 'ENV 指令会将值固化到镜像层中，任何能访问镜像的人都能看到。敏感信息应通过运行时环境变量、secrets 或配置文件挂载方式注入。',
    examples: {
      bad: `FROM node:18-alpine
ENV API_KEY=abc123secret
ENV DB_PASSWORD=mypassword
CMD ["node", "server.js"]`,
      good: `FROM node:18-alpine
# 使用运行时环境变量
# docker run -e API_KEY=xxx ...
CMD ["node", "server.js"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    for (const inst of ast.instructions) {
      if (inst.type !== 'ENV') continue

      const args = inst.args

      // 解析 ENV 的键值对
      // 格式1: ENV KEY=value KEY2=value2
      // 格式2: ENV KEY=value \
      //          KEY2=value2

      // 简单解析：按空格分割，但处理引号
      const pairs: Array<{ key: string; value: string }> = []

      // 处理带引号的值
      const keyValueRegex = /([A-Za-z_][A-Za-z0-9_]*)\s*=\s*("([^"]*)"|'([^']*)'|(\S+))/g
      let match
      while ((match = keyValueRegex.exec(args)) !== null) {
        const key = match[1]
        // match[3] 是双引号内容，match[4] 是单引号内容，match[5] 是无引号内容
        const value = match[3] ?? match[4] ?? match[5] ?? ''
        pairs.push({ key, value })
      }

      // 检查每个键值对
      for (const { key, value } of pairs) {
        // 跳过变量引用
        if (isVariableReference(value)) continue

        // 跳过示例值
        if (isExampleValue(value)) continue

        // 跳过空值
        if (isEmptyValue(value)) continue

        // 检查键名是否匹配敏感模式
        for (const { pattern, name } of SECRET_PATTERNS) {
          if (pattern.test(key)) {
            issues.push({
              id: 'E001',
              title: 'ENV 敏感信息检测',
              message: `ENV 变量 "${key}" 可能包含敏感信息（${name}），不应固化到镜像中`,
              suggestion: `使用运行时环境变量或 Docker secrets 传递敏感信息，如 docker run -e ${key}=xxx`,
              severity: 'security',
              confidence: 'high',
              line: inst.lineStart,
              instruction: 'ENV',
              category: 'security',
            })
            break // 每个键只报一次
          }
        }
      }
    }

    return issues
  },
}

// E002: ENV 重复定义警告
const ruleE002: Rule = {
  meta: {
    id: 'E002',
    name: 'ENV 重复定义',
    description: '同一 ENV 变量被多次定义，后者会覆盖前者',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'high',
    appliesTo: ['ENV'],
    rationale: '重复定义 ENV 变量虽然不会报错，但可能导致混淆和维护困难。建议合并定义或检查是否为误操作。',
    examples: {
      bad: `FROM node:18-alpine
ENV NODE_ENV=development
ENV NODE_ENV=production
CMD ["node", "server.js"]`,
      good: `FROM node:18-alpine
ENV NODE_ENV=production
CMD ["node", "server.js"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []
    const definedKeys = new Map<string, number>()

    for (const inst of ast.instructions) {
      if (inst.type !== 'ENV') continue

      const args = inst.args
      const keyValueRegex = /([A-Za-z_][A-Za-z0-9_]*)\s*=/g
      let match
      while ((match = keyValueRegex.exec(args)) !== null) {
        const key = match[1]
        if (definedKeys.has(key)) {
          issues.push({
            id: 'E002',
            title: 'ENV 重复定义',
            message: `ENV 变量 "${key}" 在第 ${definedKeys.get(key)} 行已定义，此处的定义会覆盖之前的值`,
            suggestion: '检查是否需要重复定义，或合并 ENV 指令',
            severity: 'warning',
            confidence: 'high',
            line: inst.lineStart,
            instruction: 'ENV',
            category: 'best-practice',
          })
        }
        definedKeys.set(key, inst.lineStart)
      }
    }

    return issues
  },
}

// E003: ARG 与 ENV 同名覆盖提醒
const ruleE003: Rule = {
  meta: {
    id: 'E003',
    name: 'ARG 与 ENV 同名覆盖',
    description: 'ARG 与 ENV 使用相同变量名可能导致混淆',
    category: 'best-practice',
    severity: 'warning',
    confidence: 'medium',
    appliesTo: ['ENV'],
    rationale: 'ARG 和 ENV 使用相同的变量名时，ENV 的值会在运行时覆盖 ARG 的默认值。这种设计可能是故意的，但也可能导致混淆。',
    examples: {
      bad: `FROM node:18-alpine
ARG SECRET=default-secret
ENV SECRET=production-secret
CMD ["node", "server.js"]`,
      good: `FROM node:18-alpine
ARG BUILD_SECRET=default-secret
ENV RUNTIME_SECRET=production-secret
CMD ["node", "server.js"]`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    // 收集所有 ARG 变量名
    const argNames = new Set<string>()
    for (const inst of ast.instructions) {
      if (inst.type !== 'ARG') continue
      const argName = inst.args.split('=')[0].trim()
      argNames.add(argName)
    }

    // 检查 ENV 是否使用了与 ARG 同名的变量
    for (const inst of ast.instructions) {
      if (inst.type !== 'ENV') continue

      const args = inst.args
      const keyValueRegex = /([A-Za-z_][A-Za-z0-9_]*)\s*=/g
      let match
      while ((match = keyValueRegex.exec(args)) !== null) {
        const key = match[1]
        if (argNames.has(key)) {
          issues.push({
            id: 'E003',
            title: 'ARG 与 ENV 同名覆盖',
            message: `ENV 变量 "${key}" 与 ARG 同名，ENV 的值会在运行时覆盖 ARG 的默认值`,
            suggestion: '建议使用不同的变量名以避免混淆，如 ARG BUILD_VAR 和 ENV RUNTIME_VAR',
            severity: 'warning',
            confidence: 'medium',
            line: inst.lineStart,
            instruction: 'ENV',
            category: 'best-practice',
          })
        }
      }
    }

    return issues
  },
}

// 导出所有 ENV 规则
export const envRules: Rule[] = [
  ruleE001,
  ruleE002,
  ruleE003,
]