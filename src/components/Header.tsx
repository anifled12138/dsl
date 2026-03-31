import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  onOpenExampleLibrary: () => void
  onCreateTestCase: () => void
  onOpenApiSettings: () => void
}

export function Header({
  onOpenExampleLibrary,
  onCreateTestCase,
  onOpenApiSettings
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between w-full px-7">
      {/* 左侧：Logo + 标题 */}
      <div className="flex items-center gap-4">
        <div className="w-7 h-7 bg-blue-600 text-white rounded-md flex items-center justify-center font-bold shadow-sm text-sm">
          D
        </div>
        <h1 className="font-semibold text-[15px] text-gray-900 dark:text-white tracking-tight">
          Dockerfile Validator
        </h1>
      </div>

      {/* 右侧：按钮组 */}
      <div className="flex items-center gap-4">
        {/* 新建案例 - 边框按钮 */}
        <button
          className="h-8 min-w-[88px] px-4 text-[13px] font-medium rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:bg-[#1A1A1A] dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5 transition-all"
          onClick={onCreateTestCase}
        >
          新建案例
        </button>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-2" />

        {/* 示例库 - 文字按钮 */}
        <button
          className="h-8 min-w-[68px] px-3 text-[13px] font-medium rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-all"
          onClick={onOpenExampleLibrary}
        >
          示例库
        </button>

        {/* API 设置 - 文字按钮 */}
        <button
          className="h-8 min-w-[80px] px-3 text-[13px] font-medium rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-all"
          onClick={onOpenApiSettings}
        >
          API 设置
        </button>

        {/* 主题切换 */}
        <ThemeToggle />
      </div>
    </div>
  )
}