import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from './Header'
import { ThemeProvider } from '../contexts/ThemeContext'

const renderWithTheme = (ui: React.ReactNode) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>)
}

describe('Header', () => {
  const mockOnOpenExampleLibrary = vi.fn()
  const mockOnCreateTestCase = vi.fn()
  const mockOnOpenApiSettings = vi.fn()

  it('应显示标题', () => {
    renderWithTheme(
      <Header
        onOpenExampleLibrary={mockOnOpenExampleLibrary}
        onCreateTestCase={mockOnCreateTestCase}
        onOpenApiSettings={mockOnOpenApiSettings}
      />
    )

    expect(screen.getByText('Dockerfile Validator')).toBeInTheDocument()
  })

  it('应显示示例库按钮', () => {
    renderWithTheme(
      <Header
        onOpenExampleLibrary={mockOnOpenExampleLibrary}
        onCreateTestCase={mockOnCreateTestCase}
        onOpenApiSettings={mockOnOpenApiSettings}
      />
    )

    expect(screen.getByText('示例库')).toBeInTheDocument()
  })

  it('应显示新建案例按钮', () => {
    renderWithTheme(
      <Header
        onOpenExampleLibrary={mockOnOpenExampleLibrary}
        onCreateTestCase={mockOnCreateTestCase}
        onOpenApiSettings={mockOnOpenApiSettings}
      />
    )

    expect(screen.getByText('新建案例')).toBeInTheDocument()
  })

  it('应显示 API 设置按钮', () => {
    renderWithTheme(
      <Header
        onOpenExampleLibrary={mockOnOpenExampleLibrary}
        onCreateTestCase={mockOnCreateTestCase}
        onOpenApiSettings={mockOnOpenApiSettings}
      />
    )

    expect(screen.getByText('API 设置')).toBeInTheDocument()
  })

  it('点击示例库按钮应触发回调', async () => {
    const user = userEvent.setup()

    renderWithTheme(
      <Header
        onOpenExampleLibrary={mockOnOpenExampleLibrary}
        onCreateTestCase={mockOnCreateTestCase}
        onOpenApiSettings={mockOnOpenApiSettings}
      />
    )

    await user.click(screen.getByText('示例库'))
    expect(mockOnOpenExampleLibrary).toHaveBeenCalled()
  })

  it('点击新建案例按钮应触发回调', async () => {
    const user = userEvent.setup()

    renderWithTheme(
      <Header
        onOpenExampleLibrary={mockOnOpenExampleLibrary}
        onCreateTestCase={mockOnCreateTestCase}
        onOpenApiSettings={mockOnOpenApiSettings}
      />
    )

    await user.click(screen.getByText('新建案例'))
    expect(mockOnCreateTestCase).toHaveBeenCalled()
  })
})