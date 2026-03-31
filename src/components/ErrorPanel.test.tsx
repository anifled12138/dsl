import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorPanel } from './ErrorPanel'
import type { Diagnostic } from '../types'

describe('ErrorPanel', () => {
  const mockOnErrorClick = vi.fn()
  const mockOnApplyFix = vi.fn()
  const mockOnOpenApiSettings = vi.fn()
  const mockDockerfile = 'FROM ubuntu:20.04'

  it('空列表时应显示校验通过', () => {
    render(
      <ErrorPanel
        diagnostics={[]}
        dockerfile={mockDockerfile}
        onErrorClick={mockOnErrorClick}
        onApplyFix={mockOnApplyFix}
        onOpenApiSettings={mockOnOpenApiSettings}
      />
    )

    // 使用 getAllByText 因为有两个"校验通过"文本
    expect(screen.getAllByText('校验通过').length).toBeGreaterThan(0)
    expect(screen.getByText('代码符合规范，可以安全构建')).toBeInTheDocument()
  })

  it('有诊断时应显示列表', () => {
    const diagnostics: Diagnostic[] = [
      { line: 1, column: 1, message: '测试错误', severity: 'error' },
    ]

    render(
      <ErrorPanel
        diagnostics={diagnostics}
        dockerfile={mockDockerfile}
        onErrorClick={mockOnErrorClick}
        onApplyFix={mockOnApplyFix}
        onOpenApiSettings={mockOnOpenApiSettings}
      />
    )

    expect(screen.getByText('校验未通过')).toBeInTheDocument()
    expect(screen.getByText('测试错误')).toBeInTheDocument()
  })

  it('应显示正确的错误数量', () => {
    const diagnostics: Diagnostic[] = [
      { line: 1, column: 1, message: '错误1', severity: 'error' },
      { line: 2, column: 1, message: '错误2', severity: 'error' },
    ]

    render(
      <ErrorPanel
        diagnostics={diagnostics}
        dockerfile={mockDockerfile}
        onErrorClick={mockOnErrorClick}
        onApplyFix={mockOnApplyFix}
        onOpenApiSettings={mockOnOpenApiSettings}
      />
    )

    // 严重级别卡片显示数量
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('错误项应显示正确的行号', () => {
    const diagnostics: Diagnostic[] = [
      { line: 5, column: 10, message: '测试错误', severity: 'error' },
    ]

    render(
      <ErrorPanel
        diagnostics={diagnostics}
        dockerfile={mockDockerfile}
        onErrorClick={mockOnErrorClick}
        onApplyFix={mockOnApplyFix}
        onOpenApiSettings={mockOnOpenApiSettings}
      />
    )

    expect(screen.getByText('行 5')).toBeInTheDocument()
  })

  it('不同 severity 应显示正确的消息', () => {
    const diagnostics: Diagnostic[] = [
      { line: 1, column: 1, message: '错误消息', severity: 'error' },
      { line: 2, column: 1, message: '警告消息', severity: 'warning' },
      { line: 3, column: 1, message: '信息消息', severity: 'info' },
    ]

    render(
      <ErrorPanel
        diagnostics={diagnostics}
        dockerfile={mockDockerfile}
        onErrorClick={mockOnErrorClick}
        onApplyFix={mockOnApplyFix}
        onOpenApiSettings={mockOnOpenApiSettings}
      />
    )

    expect(screen.getByText('错误消息')).toBeInTheDocument()
    expect(screen.getByText('警告消息')).toBeInTheDocument()
    expect(screen.getByText('信息消息')).toBeInTheDocument()
  })
})