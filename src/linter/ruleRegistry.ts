// ============================================
// 规则注册表
// ============================================

import { Rule, Severity, Category, LintIssue, DockerfileAST } from './types'
import { allRules } from './rules'

// 规则过滤选项
export interface RuleFilterOptions {
  severity?: Severity | Severity[]
  category?: Category | Category[]
  id?: string | string[]
  enabled?: boolean
}

// 严格模式配置
export type StrictnessLevel = 'strict' | 'standard' | 'relaxed'

// 规则注册表配置
export interface RuleRegistryConfig {
  strictness: StrictnessLevel
  disabledRules: Set<string>
  ruleSeverityOverrides: Map<string, Severity>
}

// 默认配置
const defaultConfig: RuleRegistryConfig = {
  strictness: 'standard',
  disabledRules: new Set(),
  ruleSeverityOverrides: new Map(),
}

// 规则注册表类
class RuleRegistry {
  private rules: Map<string, Rule> = new Map()
  private config: RuleRegistryConfig
  private rulesByCategory: Map<Category, Rule[]> = new Map()
  private rulesBySeverity: Map<Severity, Rule[]> = new Map()

  constructor(rules: Rule[], config: RuleRegistryConfig = defaultConfig) {
    this.config = config
    this.indexRules(rules)
  }

  // 索引规则
  private indexRules(rules: Rule[]): void {
    this.rules.clear()
    this.rulesByCategory.clear()
    this.rulesBySeverity.clear()

    for (const rule of rules) {
      this.rules.set(rule.meta.id, rule)

      // 按类别索引
      const category = rule.meta.category
      if (!this.rulesByCategory.has(category)) {
        this.rulesByCategory.set(category, [])
      }
      this.rulesByCategory.get(category)!.push(rule)

      // 按严重级别索引
      const severity = rule.meta.severity
      if (!this.rulesBySeverity.has(severity)) {
        this.rulesBySeverity.set(severity, [])
      }
      this.rulesBySeverity.get(severity)!.push(rule)
    }
  }

  // 获取所有规则
  getAllRules(): Rule[] {
    return Array.from(this.rules.values())
  }

  // 获取启用的规则
  getEnabledRules(): Rule[] {
    return this.getAllRules().filter(rule => this.isRuleEnabled(rule.meta.id))
  }

  // 根据 ID 获取规则
  getRuleById(id: string): Rule | undefined {
    return this.rules.get(id)
  }

  // 根据类别获取规则
  getRulesByCategory(category: Category): Rule[] {
    return this.rulesByCategory.get(category) || []
  }

  // 根据严重级别获取规则
  getRulesBySeverity(severity: Severity): Rule[] {
    return this.rulesBySeverity.get(severity) || []
  }

  // 过滤规则
  filterRules(options: RuleFilterOptions): Rule[] {
    let rules = this.getAllRules()

    if (options.id) {
      const ids = Array.isArray(options.id) ? options.id : [options.id]
      rules = rules.filter(r => ids.includes(r.meta.id))
    }

    if (options.severity) {
      const severities = Array.isArray(options.severity) ? options.severity : [options.severity]
      rules = rules.filter(r => severities.includes(r.meta.severity))
    }

    if (options.category) {
      const categories = Array.isArray(options.category) ? options.category : [options.category]
      rules = rules.filter(r => categories.includes(r.meta.category))
    }

    if (options.enabled !== undefined) {
      rules = rules.filter(r => this.isRuleEnabled(r.meta.id) === options.enabled)
    }

    return rules
  }

  // 检查规则是否启用
  isRuleEnabled(id: string): boolean {
    if (this.config.disabledRules.has(id)) {
      return false
    }

    // 根据严格模式调整
    const rule = this.rules.get(id)
    if (!rule) return false

    // relaxed 模式下，info 级别的规则默认禁用
    if (this.config.strictness === 'relaxed' && rule.meta.severity === 'info') {
      return false
    }

    return true
  }

  // 启用规则
  enableRule(id: string): void {
    this.config.disabledRules.delete(id)
  }

  // 禁用规则
  disableRule(id: string): void {
    this.config.disabledRules.add(id)
  }

  // 设置严格模式
  setStrictness(level: StrictnessLevel): void {
    this.config.strictness = level
  }

  // 获取当前严格模式
  getStrictness(): StrictnessLevel {
    return this.config.strictness
  }

  // 覆盖规则严重级别
  overrideSeverity(id: string, severity: Severity): void {
    this.config.ruleSeverityOverrides.set(id, severity)
  }

  // 获取规则的实际严重级别
  getEffectiveSeverity(id: string): Severity | undefined {
    if (this.config.ruleSeverityOverrides.has(id)) {
      return this.config.ruleSeverityOverrides.get(id)
    }
    const rule = this.rules.get(id)
    return rule?.meta.severity
  }

  // 运行规则检查
  runRules(ast: DockerfileAST): LintIssue[] {
    const issues: LintIssue[] = []
    const enabledRules = this.getEnabledRules()

    for (const rule of enabledRules) {
      try {
        const ruleIssues = rule.check(ast)
        // 应用严重级别覆盖
        const effectiveSeverity = this.getEffectiveSeverity(rule.meta.id)
        if (effectiveSeverity && effectiveSeverity !== rule.meta.severity) {
          for (const issue of ruleIssues) {
            issue.severity = effectiveSeverity
          }
        }
        issues.push(...ruleIssues)
      } catch (error) {
        console.error(`Rule ${rule.meta.id} failed:`, error)
      }
    }

    return issues
  }

  // 获取规则统计
  getStatistics(): {
    total: number
    enabled: number
    disabled: number
    byCategory: Record<Category, number>
    bySeverity: Record<Severity, number>
  } {
    const all = this.getAllRules()
    const enabled = this.getEnabledRules()

    const byCategory: Record<Category, number> = {
      syntax: 0,
      security: 0,
      'best-practice': 0,
      semantic: 0,
    }

    const bySeverity: Record<Severity, number> = {
      error: 0,
      warning: 0,
      security: 0,
      info: 0,
    }

    for (const rule of all) {
      byCategory[rule.meta.category]++
      bySeverity[rule.meta.severity]++
    }

    return {
      total: all.length,
      enabled: enabled.length,
      disabled: all.length - enabled.length,
      byCategory,
      bySeverity,
    }
  }
}

// 创建全局规则注册表实例
export const ruleRegistry = new RuleRegistry(allRules)

// 导出工厂函数，用于创建独立的注册表实例
export function createRuleRegistry(rules: Rule[], config?: RuleRegistryConfig): RuleRegistry {
  return new RuleRegistry(rules, config)
}