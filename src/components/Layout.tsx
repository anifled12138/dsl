import { ReactNode } from 'react'

interface LayoutProps {
  header: ReactNode
  editor: ReactNode
  panel: ReactNode
  history: ReactNode
}

export function Layout({ header, editor, panel, history }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-[#0A0A0A] text-gray-900 dark:text-gray-100 transition-colors">
      {/* 顶部状态栏 */}
      <header className="h-14 bg-white dark:bg-[#141414] border-b border-gray-200 dark:border-white/10 flex items-center shrink-0 relative z-10 transition-colors">
        {header}
      </header>

      {/* 主内容区 - 三列布局 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 左侧：编辑器 */}
        <section className="w-[45%] flex flex-col relative border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#0A0A0A] shrink-0 transition-colors z-10">
          {editor}
        </section>

        {/* 中间：校验结果面板 */}
        <aside className="flex-1 min-w-0 flex flex-col shrink-0 relative z-0">
          {panel}
        </aside>

        {/* 右侧：历史记录 */}
        <aside className="w-[340px] flex flex-col shrink-0 border-l border-gray-200 dark:border-white/10 bg-white dark:bg-[#141414] transition-colors">
          {history}
        </aside>
      </main>
    </div>
  )
}