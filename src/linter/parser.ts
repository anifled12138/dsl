// ============================================
// Parser - Dockerfile 解析为 AST
// ============================================

import {
  DockerfileAST,
  ParsedInstruction,
  BuildStage,
  StageGraph,
} from './types'

// Heredoc 信息
interface HeredocInfo {
  delimiter: string       // 结束标记，如 EOF
  startLine: number       // 开始行
  content: string[]       // 内容行
  stripTabs: boolean      // 是否去除前导制表符（<<-）
}

// 解析 Dockerfile 内容为 AST
export function parseDockerfile(content: string): DockerfileAST {
  const lines = content.split('\n')
  const instructions: ParsedInstruction[] = []
  const stages: BuildStage[] = []
  const argBeforeFrom: string[] = []

  let currentStageIndex = -1
  let currentStage: BuildStage | null = null
  let hasFrom = false
  let firstFromLine: number | undefined
  let instructionIndex = 0

  let pendingLines: number[] = []
  let pendingContent = ''

  // Heredoc 状态
  let heredoc: HeredocInfo | null = null

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1
    const rawLine = lines[i]

    // 处理 heredoc 内容
    if (heredoc) {
      // 检查是否到达结束标记
      const trimmedLine = heredoc.stripTabs ? rawLine.replace(/^\t+/, '') : rawLine
      if (trimmedLine.trim() === heredoc.delimiter) {
        // Heredoc 结束，创建指令
        const heredocContent = heredoc.content.join('\n')
        const fullContent = pendingContent + heredocContent

        // 解析指令
        const instructionMatch = pendingContent.match(/^([A-Za-z]+)/)
        if (instructionMatch) {
          const instructionType = instructionMatch[1].toUpperCase()
          const args = pendingContent.slice(instructionMatch[1].length).trim()

          const flags = parseFlags(instructionType, args)

          const instruction: ParsedInstruction = {
            type: instructionType,
            rawText: fullContent,
            args: args + '\n' + heredocContent,
            normalizedArgs: args + '\n' + heredocContent,
            lineStart: heredoc.startLine,
            lineEnd: lineNum,
            stageIndex: currentStageIndex >= 0 ? currentStageIndex : 0,
            flags,
            isComment: false,
            isEmpty: false,
          }

          // 处理指令（FROM, ARG, COPY 等）
          processInstruction(instruction, instructionIndex)

          instructions.push(instruction)
          instructionIndex++
        }

        heredoc = null
        pendingContent = ''
        pendingLines = []
        continue
      }

      // 添加到 heredoc 内容
      heredoc.content.push(rawLine)
      continue
    }

    // 处理续行符
    if (rawLine.endsWith('\\') && !rawLine.trim().endsWith('#')) {
      pendingLines.push(i)
      pendingContent += rawLine.slice(0, -1) + ' '
      continue
    }

    // 如果有续行内容，合并当前行
    let fullLine = rawLine
    let startLine = lineNum
    if (pendingLines.length > 0) {
      pendingLines.push(i)
      fullLine = pendingContent + rawLine
      startLine = pendingLines[0] + 1
      pendingLines = []
      pendingContent = ''
    }

    const trimmed = fullLine.trim()

    // 空行
    if (!trimmed) {
      instructions.push({
        type: '',
        rawText: rawLine,
        args: '',
        normalizedArgs: '',
        lineStart: lineNum,
        lineEnd: lineNum,
        stageIndex: currentStageIndex >= 0 ? currentStageIndex : 0,
        flags: {},
        isComment: false,
        isEmpty: true,
      })
      continue
    }

    // 注释行
    if (trimmed.startsWith('#')) {
      instructions.push({
        type: 'COMMENT',
        rawText: rawLine,
        args: trimmed.slice(1).trim(),
        normalizedArgs: trimmed.slice(1).trim(),
        lineStart: lineNum,
        lineEnd: lineNum,
        stageIndex: currentStageIndex >= 0 ? currentStageIndex : 0,
        flags: {},
        isComment: true,
        isEmpty: false,
      })
      continue
    }

    // 解析指令
    const instructionMatch = trimmed.match(/^([A-Za-z]+)/)
    if (!instructionMatch) {
      continue
    }

    const instructionType = instructionMatch[1].toUpperCase()
    let args = trimmed.slice(instructionMatch[1].length).trim()

    // 检测 heredoc 语法（RUN <<EOF 或 RUN <<-EOF）
    const heredocMatch = args.match(/<<(-)?(\w+)\s*$/)
    if (heredocMatch && (instructionType === 'RUN' || instructionType === 'COPY' || instructionType === 'ADD')) {
      heredoc = {
        delimiter: heredocMatch[2],
        startLine: lineNum,
        content: [],
        stripTabs: heredocMatch[1] === '-',
      }
      // 移除 heredoc 标记，保留其他参数
      args = args.replace(/<<-?\w+\s*$/, '').trim()
      pendingContent = instructionType + ' ' + args + '\n'
      continue
    }

    // 解析标志参数
    const flags = parseFlags(instructionType, args)

    const instruction: ParsedInstruction = {
      type: instructionType,
      rawText: trimmed,
      args,
      normalizedArgs: args,
      lineStart: startLine,
      lineEnd: lineNum,
      stageIndex: currentStageIndex >= 0 ? currentStageIndex : 0,
      flags,
      isComment: false,
      isEmpty: false,
    }

    // 处理指令
    processInstruction(instruction, instructionIndex)

    instructions.push(instruction)
    instructionIndex++
  }

  // 构建 Stage Graph
  const stageGraph = buildStageGraph(stages)

  return {
    rawContent: content,
    lines,
    instructions,
    stages,
    argBeforeFrom,
    hasFrom,
    firstFromLine,
    stageGraph,
  }

  // 处理指令的辅助函数
  function processInstruction(instruction: ParsedInstruction, idx: number) {
    const instructionType = instruction.type
    const args = instruction.args
    const lineNum = instruction.lineStart
    const flags = instruction.flags

    // 处理 FROM 指令（新阶段开始）
    if (instructionType === 'FROM') {
      hasFrom = true
      if (firstFromLine === undefined) {
        firstFromLine = lineNum
      }

      currentStageIndex++
      const fromInfo = parseFromInstruction(args)
      currentStage = {
        index: currentStageIndex,
        alias: fromInfo.alias,
        fromInstruction: idx,
        fromImage: fromInfo.image,
        fromTag: fromInfo.tag,
        fromDigest: fromInfo.digest,
        instructions: [idx],
        // Stage Graph 字段初始化
        references: [],
        referencedBy: [],
        isReachable: true,
        isUsed: currentStageIndex === 0, // 第一个阶段默认被使用
      }
      instruction.stageAlias = fromInfo.alias
      instruction.stageIndex = currentStageIndex
      stages.push(currentStage)
    }
    // 处理 ARG 指令
    else if (instructionType === 'ARG') {
      // 如果在 FROM 之前，记录
      if (!hasFrom) {
        const argName = args.split('=')[0].trim()
        argBeforeFrom.push(argName)
      }
      if (currentStage) {
        currentStage.instructions.push(idx)
      }
    }
    // 处理 COPY 指令，记录 --from 引用
    else if (instructionType === 'COPY' && currentStage) {
      if (flags.from) {
        currentStage.references.push(flags.from)
      }
      currentStage.instructions.push(idx)
    }
    // 其他指令
    else if (currentStage) {
      currentStage.instructions.push(idx)
    }

    // 处理 AS 别名
    if (instructionType === 'FROM' && args.toUpperCase().includes(' AS ')) {
      const asMatch = args.match(/\bAS\s+(\w+)\s*$/i)
      if (asMatch) {
        instruction.stageAlias = asMatch[1]
        if (currentStage) {
          currentStage.alias = asMatch[1]
        }
      }
    }
  }
}

// 构建阶段依赖图
function buildStageGraph(stages: BuildStage[]): StageGraph {
  const edges: StageGraph['edges'] = []
  const unusedStages: number[] = []
  const unreachableStages: number[] = []
  const circularDependencies: number[][] = []

  // 构建阶段别名到索引的映射
  const aliasToIndex = new Map<string, number>()
  for (const stage of stages) {
    if (stage.alias) {
      aliasToIndex.set(stage.alias.toLowerCase(), stage.index)
    }
  }

  // 处理每个阶段的引用
  for (const stage of stages) {
    for (const ref of stage.references) {
      const refIndex = aliasToIndex.get(ref.toLowerCase())

      edges.push({
        from: stage.index,
        to: ref,
        instructionIndex: stage.instructions.find((_, i) => {
          const inst = stage.instructions[i]
          return inst !== undefined
        }) ?? stage.fromInstruction,
      })

      // 如果引用的是一个已定义的阶段
      if (refIndex !== undefined) {
        stages[refIndex].referencedBy.push(stage.index)
        stages[refIndex].isUsed = true
      }
    }
  }

  // 检测未使用的阶段（除了最后一个阶段）
  const finalStageIndex = stages.length - 1
  for (const stage of stages) {
    if (stage.index !== finalStageIndex && !stage.isUsed) {
      unusedStages.push(stage.index)
    }
  }

  // 检测循环依赖
  const visited = new Set<number>()
  const recursionStack = new Set<number>()

  function detectCycle(stageIndex: number, path: number[]): boolean {
    visited.add(stageIndex)
    recursionStack.add(stageIndex)

    const stage = stages[stageIndex]
    for (const ref of stage.references) {
      const refIndex = aliasToIndex.get(ref.toLowerCase())
      if (refIndex === undefined) continue

      if (!visited.has(refIndex)) {
        if (detectCycle(refIndex, [...path, refIndex])) {
          return true
        }
      } else if (recursionStack.has(refIndex)) {
        // 找到循环
        const cycleStart = path.indexOf(refIndex)
        const cycle = path.slice(cycleStart)
        circularDependencies.push(cycle)

        // 标记涉及循环的阶段为不可达
        for (const idx of cycle) {
          stages[idx].isReachable = false
          if (!unreachableStages.includes(idx)) {
            unreachableStages.push(idx)
          }
        }
        return true
      }
    }

    recursionStack.delete(stageIndex)
    return false
  }

  for (const stage of stages) {
    if (!visited.has(stage.index)) {
      detectCycle(stage.index, [stage.index])
    }
  }

  return {
    nodes: stages,
    edges,
    unusedStages,
    unreachableStages,
    circularDependencies,
  }
}

// 解析 FROM 指令
function parseFromInstruction(args: string): {
  image: string
  tag?: string
  digest?: string
  alias?: string
  platform?: string
} {
  let processedArgs = args

  // 移除 --platform 参数
  const platformMatch = processedArgs.match(/--platform[=\s]+(\S+)/i)
  const platform = platformMatch?.[1]
  processedArgs = processedArgs.replace(/--platform[=\s]+\S+\s*/i, '').trim()

  // 移除 AS 别名
  let alias: string | undefined
  const asMatch = processedArgs.match(/\bAS\s+(\w+)\s*$/i)
  if (asMatch) {
    alias = asMatch[1]
    processedArgs = processedArgs.replace(/\s+AS\s+\w+\s*$/i, '').trim()
  }

  // 解析镜像名
  const imagePart = processedArgs.split(/\s+/)[0]
  let image = imagePart
  let tag: string | undefined
  let digest: string | undefined

  // 解析 digest
  if (imagePart.includes('@')) {
    const parts = imagePart.split('@')
    image = parts[0]
    digest = parts[1]
  }
  // 解析 tag
  else if (imagePart.includes(':')) {
    const parts = imagePart.split(':')
    image = parts[0]
    tag = parts[1]
  }

  return { image, tag, digest, alias, platform }
}

// 解析指令标志参数
function parseFlags(instructionType: string, args: string): Record<string, string> {
  const flags: Record<string, string> = {}

  if (instructionType === 'FROM') {
    // --platform=xxx
    const platformMatch = args.match(/--platform[=\s]+(\S+)/i)
    if (platformMatch) {
      flags.platform = platformMatch[1]
    }
  }

  if (instructionType === 'COPY') {
    // --from=xxx
    const fromMatch = args.match(/--from[=\s]+(\S+)/i)
    if (fromMatch) {
      flags.from = fromMatch[1]
    }
    // --chown=xxx
    const chownMatch = args.match(/--chown[=\s]+(\S+)/i)
    if (chownMatch) {
      flags.chown = chownMatch[1]
    }
    // --chmod=xxx (BuildKit)
    const chmodMatch = args.match(/--chmod[=\s]+(\S+)/i)
    if (chmodMatch) {
      flags.chmod = chmodMatch[1]
    }
    // --link
    if (args.includes('--link')) {
      flags.link = 'true'
    }
    // --parents (BuildKit)
    if (/\b--parents\b/i.test(args)) {
      flags.parents = 'true'
    }
    // --exclude=xxx (BuildKit)
    const excludeMatch = args.match(/--exclude[=\s]+(\S+)/i)
    if (excludeMatch) {
      flags.exclude = excludeMatch[1]
    }
  }

  if (instructionType === 'ADD') {
    // --chown=xxx
    const chownMatch = args.match(/--chown[=\s]+(\S+)/i)
    if (chownMatch) {
      flags.chown = chownMatch[1]
    }
    // --chmod=xxx (BuildKit)
    const chmodMatch = args.match(/--chmod[=\s]+(\S+)/i)
    if (chmodMatch) {
      flags.chmod = chmodMatch[1]
    }
    // --link
    if (args.includes('--link')) {
      flags.link = 'true'
    }
    // --keep-git-dir
    if (args.includes('--keep-git-dir')) {
      flags.keepGitDir = 'true'
    }
    // --checksum=xxx (for URL verification)
    const checksumMatch = args.match(/--checksum[=\s]+(\S+)/i)
    if (checksumMatch) {
      flags.checksum = checksumMatch[1]
    }
  }

  if (instructionType === 'RUN') {
    // --mount=type=cache,target=xxx,shared=xxx,...
    const mountMatch = args.match(/--mount[=\s]+(\S+)/i)
    if (mountMatch) {
      flags.mount = mountMatch[1]
      // 解析 mount 参数为结构化对象
      const mountParams = parseMountParams(mountMatch[1])
      Object.assign(flags, mountParams)
    }
    // --network=host|none|default
    const networkMatch = args.match(/--network[=\s]+(\S+)/i)
    if (networkMatch) {
      flags.network = networkMatch[1]
    }
    // --security=insecure|sandbox (BuildKit)
    const securityMatch = args.match(/--security[=\s]+(\S+)/i)
    if (securityMatch) {
      flags.security = securityMatch[1]
    }
  }

  if (instructionType === 'HEALTHCHECK') {
    // --interval=xxx, --timeout=xxx, --start-period=xxx, --start-interval=xxx, --retries=xxx
    const intervalMatch = args.match(/--interval[=\s]+(\S+)/i)
    if (intervalMatch) flags.interval = intervalMatch[1]

    const timeoutMatch = args.match(/--timeout[=\s]+(\S+)/i)
    if (timeoutMatch) flags.timeout = timeoutMatch[1]

    const startPeriodMatch = args.match(/--start-period[=\s]+(\S+)/i)
    if (startPeriodMatch) flags.startPeriod = startPeriodMatch[1]

    const startIntervalMatch = args.match(/--start-interval[=\s]+(\S+)/i)
    if (startIntervalMatch) flags.startInterval = startIntervalMatch[1]

    const retriesMatch = args.match(/--retries[=\s]+(\d+)/i)
    if (retriesMatch) flags.retries = retriesMatch[1]
  }

  return flags
}

// 解析 RUN --mount 参数
function parseMountParams(mountStr: string): Record<string, string> {
  const result: Record<string, string> = {}
  const parts = mountStr.split(',')

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key && value) {
      result[`mount_${key}`] = value
    } else if (key) {
      result[`mount_${key}`] = 'true'
    }
  }

  return result
}

// 获取指定阶段的指令
export function getInstructionsInStage(
  ast: DockerfileAST,
  stageIndex: number
): ParsedInstruction[] {
  const stage = ast.stages[stageIndex]
  if (!stage) return []

  return stage.instructions.map(i => ast.instructions[i])
}

// 获取最终阶段
export function getFinalStage(ast: DockerfileAST): BuildStage | null {
  if (ast.stages.length === 0) return null
  return ast.stages[ast.stages.length - 1]
}

// 获取最终阶段的指令
export function getFinalStageInstructions(ast: DockerfileAST): ParsedInstruction[] {
  const finalStage = getFinalStage(ast)
  if (!finalStage) return []

  return finalStage.instructions.map(i => ast.instructions[i])
}

// 检查是否在注释中
export function isLineInComment(ast: DockerfileAST, lineNum: number): boolean {
  const instruction = ast.instructions.find(
    i => i.lineStart <= lineNum && i.lineEnd >= lineNum
  )
  return instruction?.isComment ?? false
}

// 获取阶段别名集合
export function getStageAliases(ast: DockerfileAST): Set<string> {
  const aliases = new Set<string>()
  for (const stage of ast.stages) {
    if (stage.alias) {
      aliases.add(stage.alias.toLowerCase())
    }
  }
  return aliases
}