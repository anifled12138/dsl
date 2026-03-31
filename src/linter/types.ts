// ============================================
// 类型定义 - 统一输出协议
// ============================================

// 问题严重级别
export type Severity = 'error' | 'warning' | 'info' | 'security'

// 规则置信度
export type Confidence = 'high' | 'medium' | 'low'

// 规则类别
export type Category = 'syntax' | 'security' | 'best-practice' | 'semantic'

// 统一输出的问题结构
export interface LintIssue {
  id: string                   // 规则编号，如 R002
  title: string                // 问题标题
  message: string              // 问题说明
  suggestion?: string          // 修复建议
  severity: Severity
  confidence: Confidence
  line: number                 // 行号
  column?: number              // 列号
  instruction?: string         // 对应指令
  stage?: string               // 所属阶段别名
  stageIndex?: number          // 阶段索引
  category: Category
}

// 规则元数据
export interface RuleMeta {
  id: string
  name: string
  description: string
  category: Category
  severity: Severity
  confidence: Confidence
  appliesTo: string[]          // 适用的指令列表
  rationale: string            // 规则依据（为什么存在）
  examples: {
    bad: string                // 反例
    good: string               // 正例
  }
}

// ============================================
// Parser 结构 - AST 定义
// ============================================

// 解析后的指令
export interface ParsedInstruction {
  type: string                 // 指令类型（大写，如 FROM, RUN）
  rawText: string              // 原始文本（包含指令名）
  args: string                 // 参数部分（不含指令名）
  normalizedArgs: string       // 规范化参数（续行合并后）
  lineStart: number            // 起始行号（1-based）
  lineEnd: number              // 结束行号（续行情况）
  stageIndex: number           // 阶段编号（0开始）
  stageAlias?: string          // 阶段别名（FROM ... AS xxx）
  flags: Record<string, string> // 解析的标志参数（如 --from, --chown）
  isComment: boolean           // 是否是注释行
  isEmpty: boolean             // 是否是空行
}

// 构建阶段
export interface BuildStage {
  index: number                // 阶段索引
  alias?: string               // 阶段别名
  fromInstruction: number      // FROM 指令在 instructions 数组中的索引
  fromImage: string            // 基础镜像
  fromTag?: string             // 镜像标签
  fromDigest?: string          // 镜像摘要
  instructions: number[]       // 该阶段内指令的索引
  // Stage Graph 相关字段
  references: string[]         // 引用的其他阶段别名（COPY --from）
  referencedBy: number[]       // 被哪些阶段索引引用
  isReachable: boolean         // 是否可达（无循环依赖）
  isUsed: boolean              // 是否被使用（被 COPY --from 引用）
}

// 阶段依赖图
export interface StageGraph {
  nodes: BuildStage[]          // 所有阶段节点
  edges: Array<{               // 依赖边
    from: number               // 源阶段索引
    to: string                 // 目标阶段别名或镜像名
    instructionIndex: number   // 引用指令的索引
  }>
  unusedStages: number[]       // 未使用的阶段索引
  unreachableStages: number[]  // 不可达的阶段索引
  circularDependencies: number[][] // 循环依赖的阶段组
}

// Dockerfile AST
export interface DockerfileAST {
  rawContent: string           // 原始内容
  lines: string[]              // 按行分割
  instructions: ParsedInstruction[]  // 所有指令
  stages: BuildStage[]         // 所有阶段
  argBeforeFrom: string[]      // FROM 前的 ARG 名称
  hasFrom: boolean             // 是否包含 FROM
  firstFromLine?: number       // 第一个 FROM 的行号
  stageGraph?: StageGraph      // 阶段依赖图
}

// ============================================
// 规则接口
// ============================================

// 规则检查函数类型
export type RuleCheckFn = (
  ast: DockerfileAST,
  instruction?: ParsedInstruction,
  options?: RuleCheckOptions
) => LintIssue[]

// 规则检查选项
export interface RuleCheckOptions {
  isComment?: boolean          // 是否在注释中
  isExample?: boolean          // 是否是示例字符串
  stageIndex?: number          // 当前阶段索引
}

// 规则接口
export interface Rule {
  meta: RuleMeta
  check: RuleCheckFn
}

// ============================================
// 误报抑制
// ============================================

// 误报抑制原因
export type SuppressionReason =
  | 'comment'                  // 在注释中
  | 'example-string'           // 是示例字符串
  | 'variable-reference'       // 是变量引用
  | 'builder-stage'            // 在 builder 阶段（非 final stage）
  | 'echo-command'             // 是 echo 命令内容
  | 'empty-value'              // 空值

// 抑制结果
export interface SuppressionResult {
  suppressed: boolean
  reason?: SuppressionReason
}

// ============================================
// 规则去重
// ============================================

// 问题分组键
export interface IssueGroupKey {
  line: number
  category: string             // 问题类别
  relatedInstruction?: string  // 相关指令
}

// 去重后的结果
export interface DeduplicatedIssues {
  issues: LintIssue[]
  suppressed: Array<{ issue: LintIssue; reason: string }>
}