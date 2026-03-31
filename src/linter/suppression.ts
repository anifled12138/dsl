// ============================================
// 误报抑制模块
// ============================================

import { DockerfileAST, ParsedInstruction, SuppressionResult } from './types'

// 示例字符串关键词
const EXAMPLE_KEYWORDS = [
  'example', 'sample', 'demo', 'test', 'placeholder',
  'your-', 'your_', 'xxx', 'change-me', 'changeme',
  '<', '>', 'foo', 'bar', 'baz'
]

// 敏感信息关键词（用于检测是否是占位符）
const PLACEHOLDER_PATTERNS = [
  /^\$\{?[A-Za-z_]+\}?$/,       // ${VAR} 或 $VAR
  /^<[^>]+>$/,                  // <placeholder>
  /^xxx+$/i,                     // xxx
  /^your[-_]?/i,                 // your-xxx, your_xxx
  /^(example|sample|demo)/i,    // example-xxx
]

// echo 命令中的内容不应触发敏感信息检测
const ECHO_COMMAND_PATTERN = /^\s*echo\s+/i

// 检查指令是否在注释中
export function isInComment(ast: DockerfileAST, lineNum: number): boolean {
  const instruction = ast.instructions.find(
    i => i.lineStart <= lineNum && i.lineEnd >= lineNum
  )
  return instruction?.isComment ?? false
}

// 检查字符串是否是示例/占位符
export function isExampleString(value: string): boolean {
  const lowerValue = value.toLowerCase()

  // 检查关键词
  for (const keyword of EXAMPLE_KEYWORDS) {
    if (lowerValue.includes(keyword)) {
      return true
    }
  }

  // 检查占位符模式
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(value)) {
      return true
    }
  }

  return false
}

// 检查是否是变量引用
export function isVariableReference(value: string): boolean {
  // ${VAR} 或 $VAR 格式
  return /^\$\{?[A-Za-z_][A-Za-z0-9_]*\}?$/.test(value)
}

// 检查是否包含变量引用（更宽松）
export function containsVariableReference(value: string): boolean {
  return /\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/.test(value)
}

// 检查 RUN 指令是否是 echo 命令
export function isEchoCommand(args: string): boolean {
  return ECHO_COMMAND_PATTERN.test(args)
}

// 检查敏感词是否应该被忽略
export function shouldSuppressSensitiveWord(
  ast: DockerfileAST,
  instruction: ParsedInstruction,
  keyword: string
): SuppressionResult {
  // 1. 在注释中
  if (instruction.isComment) {
    return { suppressed: true, reason: 'comment' }
  }

  // 2. 是变量引用
  if (isVariableReference(keyword)) {
    return { suppressed: true, reason: 'variable-reference' }
  }

  // 3. 是示例字符串
  if (isExampleString(keyword)) {
    return { suppressed: true, reason: 'example-string' }
  }

  // 4. 在 builder 阶段（非 final stage）且不是安全关键
  if (ast.stages.length > 1) {
    const finalStageIndex = ast.stages.length - 1
    if (instruction.stageIndex < finalStageIndex) {
      // 在非最终阶段，某些警告可以降级
      return { suppressed: true, reason: 'builder-stage' }
    }
  }

  return { suppressed: false }
}

// 检查 RUN 命令中的敏感操作是否应该被忽略
export function shouldSuppressRunCommand(
  ast: DockerfileAST,
  instruction: ParsedInstruction,
  command: string
): SuppressionResult {
  // 1. 在注释中
  if (instruction.isComment) {
    return { suppressed: true, reason: 'comment' }
  }

  // 2. 在示例字符串中
  const args = instruction.args
  if (isExampleString(args)) {
    return { suppressed: true, reason: 'example-string' }
  }

  // 3. 是 echo 命令，其中的内容不应触发敏感信息检测
  if (isEchoCommand(args)) {
    return { suppressed: true, reason: 'echo-command' }
  }

  // 4. 在 builder 阶段安装某些工具（如 ssh client）是可以接受的
  if (ast.stages.length > 1) {
    const finalStageIndex = ast.stages.length - 1
    if (instruction.stageIndex < finalStageIndex) {
      // builder 阶段安装 ssh client 是正常的
      if (/apt-get.*install.*openssh-client/i.test(command)) {
        return { suppressed: true, reason: 'builder-stage' }
      }
    }
  }

  return { suppressed: false }
}

// 检查 curl|bash 类命令是否应该被忽略
export function shouldSuppressPipeCommand(
  _ast: DockerfileAST,
  instruction: ParsedInstruction,
  pipeCommand: string
): SuppressionResult {
  // 1. 在注释中
  if (instruction.isComment) {
    return { suppressed: true, reason: 'comment' }
  }

  // 2. 是示例 URL
  if (isExampleString(pipeCommand)) {
    return { suppressed: true, reason: 'example-string' }
  }

  // 3. URL 包含 example.com 或类似占位符域名
  if (/example\.(com|org|net)|localhost|127\.0\.0\.1|test\./i.test(pipeCommand)) {
    return { suppressed: true, reason: 'example-string' }
  }

  return { suppressed: false }
}

// 检查敏感文件复制是否应该被忽略
export function shouldSuppressSensitiveFileCopy(
  ast: DockerfileAST,
  instruction: ParsedInstruction,
  filePath: string
): SuppressionResult {
  // 1. 在注释中
  if (instruction.isComment) {
    return { suppressed: true, reason: 'comment' }
  }

  // 2. 在示例字符串中
  if (isExampleString(filePath)) {
    return { suppressed: true, reason: 'example-string' }
  }

  // 3. 是变量引用
  if (containsVariableReference(filePath)) {
    return { suppressed: true, reason: 'variable-reference' }
  }

  // 4. 在 builder 阶段复制敏感文件可能是为了构建需要
  if (ast.stages.length > 1) {
    const finalStageIndex = ast.stages.length - 1
    if (instruction.stageIndex < finalStageIndex) {
      // builder 阶段，检查是否在后续阶段被清理
      // 这里简化处理，不抑制但可以降级
      return { suppressed: false }
    }
  }

  return { suppressed: false }
}

// 检查 ENV 敏感信息是否应该被忽略
export function shouldSuppressEnvSecret(
  instruction: ParsedInstruction,
  _key: string,
  value: string
): SuppressionResult {
  // 1. 在注释中
  if (instruction.isComment) {
    return { suppressed: true, reason: 'comment' }
  }

  // 2. 是变量引用
  if (isVariableReference(value)) {
    return { suppressed: true, reason: 'variable-reference' }
  }

  // 3. 是示例值
  if (isExampleString(value)) {
    return { suppressed: true, reason: 'example-string' }
  }

  // 4. 空值
  if (value.trim() === '' || value.trim() === '""' || value.trim() === "''") {
    return { suppressed: true, reason: 'empty-value' }
  }

  return { suppressed: false }
}

// 综合检查：判断某个问题是否应该被抑制
export function shouldSuppressIssue(
  ast: DockerfileAST,
  instruction: ParsedInstruction,
  issueType: 'sensitive-word' | 'pipe-command' | 'sudo' | 'sensitive-file' | 'env-secret' | 'other',
  context?: string
): SuppressionResult {
  switch (issueType) {
    case 'sensitive-word':
      return shouldSuppressSensitiveWord(ast, instruction, context || '')

    case 'pipe-command':
      return shouldSuppressPipeCommand(ast, instruction, context || '')

    case 'sudo':
      return shouldSuppressRunCommand(ast, instruction, context || 'sudo')

    case 'sensitive-file':
      return shouldSuppressSensitiveFileCopy(ast, instruction, context || '')

    case 'env-secret':
      return shouldSuppressEnvSecret(instruction, context?.split('=')[0] || '', context?.split('=')[1] || '')

    default:
      return { suppressed: false }
  }
}