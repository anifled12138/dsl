// 自定义测试案例
export interface CustomTestCase {
  id: string
  name: string
  description: string
  content: string
  expectedDiagnostics: {
    errors: number
    warnings: number
    infos: number
  }
  createdAt: number
}

const STORAGE_KEY = 'dockerfile-custom-tests'

// 获取自定义测试案例
export function getCustomTestCases(): CustomTestCase[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // ignore
  }
  return []
}

// 保存自定义测试案例
export function saveCustomTestCase(testCase: Omit<CustomTestCase, 'id' | 'createdAt'>): CustomTestCase {
  const cases = getCustomTestCases()

  const newCase: CustomTestCase = {
    ...testCase,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  }

  cases.push(newCase)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))

  return newCase
}

// 更新自定义测试案例
export function updateCustomTestCase(id: string, updates: Partial<Omit<CustomTestCase, 'id' | 'createdAt'>>): void {
  const cases = getCustomTestCases()
  const index = cases.findIndex(c => c.id === id)

  if (index !== -1) {
    cases[index] = { ...cases[index], ...updates }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
  }
}

// 删除自定义测试案例
export function deleteCustomTestCase(id: string): void {
  const cases = getCustomTestCases()
  const filtered = cases.filter(c => c.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

// 清空所有自定义测试案例
export function clearCustomTestCases(): void {
  localStorage.removeItem(STORAGE_KEY)
}

// 导出自定义测试案例为JSON
export function exportCustomTestCases(): string {
  const cases = getCustomTestCases()
  return JSON.stringify(cases, null, 2)
}

// 导入自定义测试案例
export function importCustomTestCases(json: string): boolean {
  try {
    const cases = JSON.parse(json)
    if (Array.isArray(cases)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
      return true
    }
  } catch {
    // ignore
  }
  return false
}