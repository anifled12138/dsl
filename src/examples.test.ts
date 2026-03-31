import { describe, it, expect } from 'vitest'
import { EXAMPLES, getRandomExample, getExamplesByCategory, getExampleStats } from './examples'

describe('examples', () => {
  it('EXAMPLES 应有多个示例', () => {
    expect(EXAMPLES.length).toBeGreaterThan(30)
  })

  it('所有示例应有 content', () => {
    EXAMPLES.forEach(example => {
      // 允许空内容用于测试边缘情况（如空 Dockerfile）
      if (example.id === 'empty-dockerfile') {
        expect(example.content).toBe('')
      } else {
        expect(example.content, `示例 ${example.id} 的 content 为空`).toBeTruthy()
        expect(example.content.length).toBeGreaterThan(0)
      }
      expect(typeof example.content).toBe('string')
    })
  })

  it('所有示例应有 expectedDiagnostics', () => {
    EXAMPLES.forEach(example => {
      expect(example.expectedDiagnostics).toBeDefined()
      expect(typeof example.expectedDiagnostics.errors).toBe('number')
      expect(typeof example.expectedDiagnostics.warnings).toBe('number')
      expect(typeof example.expectedDiagnostics.infos).toBe('number')
    })
  })

  it('getRandomExample 应返回一个示例', () => {
    const example = getRandomExample()
    expect(example).toBeDefined()
    expect(example.id).toBeTruthy()
  })

  it('getExamplesByCategory 应正确过滤', () => {
    const correctExamples = getExamplesByCategory('correct')
    expect(correctExamples.length).toBeGreaterThan(0)
    correctExamples.forEach(e => {
      expect(e.category).toBe('correct')
    })
  })

  it('getExampleStats 应返回正确的统计', () => {
    const stats = getExampleStats()
    expect(stats.total).toBe(EXAMPLES.length)
    expect(stats.correct + stats.error + stats.warning + stats.mixed).toBe(stats.total)
  })

  it('示例应有唯一的 id', () => {
    const ids = EXAMPLES.map(e => e.id)
    const uniqueIds = new Set(ids)
    expect(ids.length).toBe(uniqueIds.size)
  })

  it('示例应覆盖不同分类', () => {
    const categories = new Set(EXAMPLES.map(e => e.category))
    expect(categories.has('correct')).toBe(true)
    expect(categories.has('error')).toBe(true)
    expect(categories.has('warning')).toBe(true)
    expect(categories.has('mixed')).toBe(true)
  })
})