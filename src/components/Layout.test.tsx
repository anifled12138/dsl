import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Layout } from './Layout'

describe('Layout', () => {
  it('应正确渲染 header', () => {
    render(
      <Layout
        header={<div>测试头部</div>}
        editor={<div>测试编辑器</div>}
        panel={<div>测试面板</div>}
        history={<div>测试历史</div>}
      />
    )

    expect(screen.getByText('测试头部')).toBeInTheDocument()
  })

  it('应正确渲染 editor', () => {
    render(
      <Layout
        header={<div>头部</div>}
        editor={<div>编辑器内容</div>}
        panel={<div>面板</div>}
        history={<div>历史</div>}
      />
    )

    expect(screen.getByText('编辑器内容')).toBeInTheDocument()
  })

  it('应正确渲染 panel', () => {
    render(
      <Layout
        header={<div>头部</div>}
        editor={<div>编辑器</div>}
        panel={<div>右侧面板</div>}
        history={<div>历史</div>}
      />
    )

    expect(screen.getByText('右侧面板')).toBeInTheDocument()
  })

  it('应正确渲染 history', () => {
    render(
      <Layout
        header={<div>头部</div>}
        editor={<div>编辑器</div>}
        panel={<div>面板</div>}
        history={<div>历史记录</div>}
      />
    )

    expect(screen.getByText('历史记录')).toBeInTheDocument()
  })

  it('所有部分应同时存在', () => {
    render(
      <Layout
        header={<div>Header</div>}
        editor={<div>Editor</div>}
        panel={<div>Panel</div>}
        history={<div>History</div>}
      />
    )

    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(screen.getByText('Editor')).toBeInTheDocument()
    expect(screen.getByText('Panel')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
  })
})