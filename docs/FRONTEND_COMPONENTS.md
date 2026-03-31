# 前端组件完整文档

本文档包含所有前端组件的完整代码，方便您直接修改样式。

---

## 目录

1. [页面布局 - Layout.tsx](#1-页面布局---layouttsx)
2. [顶部导航 - Header.tsx](#2-顶部导航---headertsx)
3. [代码编辑器 - CodeEditor.tsx](#3-代码编辑器---codeeditortsx)
4. [校验结果面板 - ErrorPanel.tsx](#4-校验结果面板---errorpaneltsx)
5. [历史记录面板 - HistoryPanel.tsx](#5-历史记录面板---historypaneltsx)
6. [问题详情面板 - IssueDetailPanel.tsx](#6-问题详情面板---issuedetailpaneltsx)
7. [示例库弹窗 - ExampleLibrary.tsx](#7-示例库弹窗---examplelibrarytsx)
8. [API设置弹窗 - ApiKeyModal.tsx](#8-api设置弹窗---apikeymodaltsx)
9. [新建案例弹窗 - TestCaseModal.tsx](#9-新建案例弹窗---testcasemodaltsx)
10. [主题切换按钮 - ThemeToggle.tsx](#10-主题切换按钮---themetoggletsx)
11. [样式规范参考](#11-样式规范参考)

---

## 1. 页面布局 - Layout.tsx

**文件路径**: `src/components/Layout.tsx`

**功能**: 定义整体三列布局结构

```tsx
import { ReactNode } from 'react'

interface LayoutProps {
  header: ReactNode
  editor: ReactNode
  panel: ReactNode
  history: ReactNode
}

export function Layout({ header, editor, panel, history }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100">
      {/* ==================== 顶部状态栏 ==================== */}
      {/* 高度: h-14 (56px) */}
      {/* 背景: 白色，底部边框 */}
      <header className="h-14 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 flex items-center shrink-0 shadow-sm relative z-10">
        {header}
      </header>

      {/* ==================== 主内容区 - 三列布局 ==================== */}
      <main className="flex-1 flex overflow-hidden">

        {/* 左侧：编辑器 */}
        {/* 宽度: 45% 固定 */}
        <section className="w-[45%] flex flex-col relative border-r border-gray-200 dark:border-slate-700 shrink-0">
          {editor}
        </section>

        {/* 中间：校验结果面板 */}
        {/* 宽度: 弹性填充 */}
        <aside className="flex-1 min-w-0 bg-white dark:bg-slate-800 flex flex-col shrink-0">
          {panel}
        </aside>

        {/* 右侧：历史记录 */}
        {/* 宽度: 340px 固定 */}
        <aside className="w-[340px] flex flex-col shrink-0 border-l border-gray-200 dark:border-slate-700">
          {history}
        </aside>
      </main>
    </div>
  )
}
```

**可修改的关键样式点**:
- 三列宽度比例：修改 `w-[45%]`、`flex-1`、`w-[340px]`
- 边框颜色：修改 `border-gray-200`
- 背景颜色：修改 `bg-gray-50`

---

## 2. 顶部导航 - Header.tsx

**文件路径**: `src/components/Header.tsx`

**功能**: 顶部导航栏，包含Logo、标题、操作按钮

```tsx
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  onOpenExampleLibrary: () => void
  onRunFullTest: () => void
  onCreateTestCase: () => void
  onOpenApiSettings: () => void
}

export function Header({
  onOpenExampleLibrary,
  onRunFullTest,
  onCreateTestCase,
  onOpenApiSettings
}: HeaderProps) {
  return (
    <div className="flex items-center justify-between w-full px-5">
      {/* ==================== 左侧：Logo + 标题 ==================== */}
      <div className="flex items-center gap-3">
        {/* Logo方块 */}
        {/* 尺寸: 32x32px */}
        {/* 背景: 蓝色渐变风格 */}
        <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
          D
        </div>
        {/* 标题 */}
        <h1 className="font-bold text-lg text-gray-800 dark:text-slate-100 tracking-tight">
          Dockerfile 校验器
        </h1>
      </div>

      {/* ==================== 右侧：按钮组 ==================== */}
      <div className="flex items-center gap-2">

        {/* 示例库按钮 - 蓝色强调按钮 */}
        <button
          className="h-9 px-4 text-sm font-medium rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          onClick={onOpenExampleLibrary}
          title="打开示例库"
        >
          示例库
        </button>

        {/* 新建案例按钮 - 边框按钮 */}
        <button
          className="h-9 px-4 text-sm font-medium rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          onClick={onCreateTestCase}
          title="将当前代码保存为测试案例"
        >
          新建案例
        </button>

        {/* 全量测试按钮 - 边框按钮 */}
        <button
          className="h-9 px-4 text-sm font-medium rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          onClick={onRunFullTest}
          title="运行全量测试"
        >
          全量测试
        </button>

        {/* 分隔线 */}
        <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mx-1" />

        {/* API 设置按钮 - 灰色按钮 */}
        <button
          className="h-9 px-4 text-sm font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          onClick={onOpenApiSettings}
          title="API 设置"
        >
          API 设置
        </button>

        {/* 主题切换 */}
        <ThemeToggle />
      </div>
    </div>
  )
}
```

**可修改的关键样式点**:
- 按钮高度: `h-9` (36px)
- 按钮圆角: `rounded-lg` (8px)
- 按钮间距: `gap-2` (8px)
- 强调按钮颜色: `bg-blue-50 text-blue-600`
- 边框按钮: `border border-gray-200 bg-white`

---

## 3. 代码编辑器 - CodeEditor.tsx

**文件路径**: `src/components/CodeEditor.tsx`

**功能**: Monaco 编辑器封装，支持行高亮和诊断标记

```tsx
import Editor, { OnMount, Monaco } from '@monaco-editor/react'
import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import type { editor } from 'monaco-editor'
import { useTheme } from '../contexts/ThemeContext'
import type { Diagnostic, Severity } from '../types'

export type { Diagnostic } from '../types'

export interface CodeEditorRef {
  goToLine: (line: number, lineEnd?: number, severity?: Severity) => void
  setMarkers: (diagnostics: Diagnostic[]) => void
}

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  diagnostics?: Diagnostic[]
}

// 存储高亮装饰
let highlightDecorations: string[] = []

// 严重级别对应的 CSS 类名
const severityHighlightClasses: Record<Severity, { line: string; glyph: string }> = {
  error: { line: 'highlighted-line-error', glyph: 'highlighted-line-error-glyph' },
  security: { line: 'highlighted-line-security', glyph: 'highlighted-line-security-glyph' },
  warning: { line: 'highlighted-line-warning', glyph: 'highlighted-line-warning-glyph' },
  info: { line: 'highlighted-line-info', glyph: 'highlighted-line-info-glyph' },
}

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
  ({ value, onChange, diagnostics }, ref) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const monacoRef = useRef<Monaco | null>(null)
    const { theme } = useTheme()

    // ... 省略内部方法实现 ...

    return (
      <Editor
        height="100%"
        defaultLanguage="dockerfile"
        value={value}
        onChange={(v) => {
          onChange(v || '')
        }}
        onMount={handleMount}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          quickSuggestions: true,
          formatOnPaste: true,
        }}
      />
    )
  }
)
```

**可修改的关键样式点**:
- 编辑器字体大小: `fontSize: 14`
- 是否显示 minimap: `minimap: { enabled: false }`
- 自动换行: `wordWrap: 'on'`

---

## 4. 校验结果面板 - ErrorPanel.tsx

**文件路径**: `src/components/ErrorPanel.tsx`

**功能**: 显示校验结果列表，支持过滤和AI修复

### 4.1 头部区域

```tsx
{/* 头部 */}
<div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
  <h2 className="font-semibold text-gray-800 dark:text-slate-100">校验结果</h2>
  <div className="flex gap-2">
    <button className="h-9 px-4 text-sm rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
      过滤
    </button>
    <button className="h-9 px-4 text-sm rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
      导出
    </button>
  </div>
</div>
```

### 4.2 严重级别卡片

```tsx
{/* 严重级别卡片 - 横向排列 */}
<div className="px-5 py-4 flex gap-3">
  {/* 错误卡片 */}
  <button className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-between cursor-pointer transition-colors bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-gray-100 dark:border-slate-700">
    <span className="flex items-center gap-2">🔴 错误</span>
    <span className="bg-red-100 dark:bg-red-800/50 px-2 py-0.5 rounded text-xs">0</span>
  </button>

  {/* 安全卡片 */}
  <button className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-between cursor-pointer transition-colors bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-gray-100 dark:border-slate-700">
    <span className="flex items-center gap-2">🔒 安全</span>
    <span className="bg-orange-100 dark:bg-orange-800/50 px-2 py-0.5 rounded text-xs">0</span>
  </button>

  {/* 警告卡片 */}
  <button className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-between cursor-pointer transition-colors bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border border-gray-100 dark:border-slate-700">
    <span className="flex items-center gap-2">🟡 警告</span>
    <span className="bg-yellow-100 dark:bg-yellow-800/50 px-2 py-0.5 rounded text-xs">0</span>
  </button>

  {/* 信息卡片 */}
  <button className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-between cursor-pointer transition-colors bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-gray-100 dark:border-slate-700">
    <span className="flex items-center gap-2">ℹ️ 信息</span>
    <span className="bg-blue-100 dark:bg-blue-800/50 px-2 py-0.5 rounded text-xs">0</span>
  </button>
</div>
```

### 4.3 问题卡片

```tsx
{/* 问题卡片 */}
<div className="p-4 bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer">
  {/* 左侧颜色条 - 根据严重级别变色 */}
  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" /> {/* error: bg-red-500, warning: bg-yellow-400, info: bg-blue-400, security: bg-orange-500 */}

  {/* 头部：行号 + ID */}
  <div className="flex justify-between items-start mb-2">
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
        行 5
      </span>
      <span className="text-xs text-gray-400 border border-gray-100 px-2 py-1 rounded-md">
        F004
      </span>
    </div>
  </div>

  {/* 描述 */}
  <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
    禁止使用 latest 标签
  </p>
</div>
```

**可修改的关键样式点**:
- 卡片圆角: `rounded-xl` (12px)
- 卡片内边距: `p-4` (16px)
- 左侧颜色条宽度: `w-1`
- 严重级别颜色:
  - 错误: `bg-red-50 text-red-600`
  - 警告: `bg-yellow-50 text-yellow-600`
  - 安全: `bg-orange-50 text-orange-600`
  - 信息: `bg-blue-50 text-blue-600`

---

## 5. 历史记录面板 - HistoryPanel.tsx

**文件路径**: `src/components/HistoryPanel.tsx`

### 5.1 头部

```tsx
<div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700">
  <h2 className="font-semibold text-gray-800 dark:text-slate-100">历史记录</h2>
  <button className="text-sm text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
    清空
  </button>
</div>
```

### 5.2 历史卡片

```tsx
<div className="p-4 rounded-xl cursor-pointer relative transition-all bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:shadow-md">
  {/* 状态和时间 */}
  <div className="flex justify-between items-center mb-3">
    {/* 通过状态 */}
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
      校验通过
    </span>
    {/* 失败状态 */}
    {/* <span className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">...</span> */}

    <span className="text-xs text-gray-400 dark:text-slate-500">14:23</span>
  </div>

  {/* 代码预览 */}
  <div className="bg-gray-100 dark:bg-slate-900 rounded-lg p-3 mb-3">
    <pre className="text-xs text-gray-600 dark:text-slate-400 font-mono whitespace-pre-wrap line-clamp-3 leading-relaxed">
      FROM ubuntu:latest
      RUN apt-get update
      USER root
    </pre>
  </div>

  {/* 统计信息 */}
  <div className="flex gap-3 text-xs font-medium">
    <span className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded">
      1 错误
    </span>
    <span className="text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-0.5 rounded">
      1 警告
    </span>
  </div>

  {/* 删除按钮 */}
  <button className="absolute top-3 right-3 text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors text-sm">
    ✕
  </button>
</div>
```

---

## 6. 问题详情面板 - IssueDetailPanel.tsx

**文件路径**: `src/components/IssueDetailPanel.tsx`

```tsx
{/* 头部 */}
<div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700">
  <div className="flex items-center gap-2">
    <span>🔴</span>
    <h2 className="font-semibold text-gray-800 dark:text-slate-100">问题详情</h2>
  </div>
  <button className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
    ✕
  </button>
</div>

{/* 内容 */}
<div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
  {/* 标签行 */}
  <div className="flex flex-wrap items-center gap-2 py-4">
    <span className="px-2 py-1 text-xs font-mono bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
      F004
    </span>
    <span className="px-2 py-1 text-xs rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
      错误
    </span>
  </div>

  {/* 位置信息 */}
  <div className="text-sm text-gray-500 dark:text-slate-400">
    📍 行 5
    <span className="ml-2 px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs font-mono">
      FROM
    </span>
  </div>

  {/* 问题描述 */}
  <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg">
    <p className="text-sm text-gray-700 dark:text-slate-300">
      在生产环境中，基础镜像必须指定具体的版本号...
    </p>
  </div>

  {/* 修复建议 */}
  <div className="space-y-2">
    <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300">💡 修复建议</h4>
    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
      <p className="text-sm text-gray-700 dark:text-slate-300">使用具体的版本号...</p>
      <div className="mt-2 flex gap-2">
        <button className="text-xs px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
          复制
        </button>
        <button className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          应用
        </button>
      </div>
    </div>
  </div>

  {/* 代码示例 */}
  <div className="grid grid-cols-2 gap-3">
    <div>
      <div className="text-xs text-red-500 dark:text-red-400 mb-1 font-medium">❌ 反例</div>
      <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800 overflow-x-auto">
        FROM ubuntu:latest
      </pre>
    </div>
    <div>
      <div className="text-xs text-green-500 dark:text-green-400 mb-1 font-medium">✅ 正例</div>
      <pre className="text-xs bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800 overflow-x-auto">
        FROM ubuntu:22.04
      </pre>
    </div>
  </div>
</div>
```

---

## 7. 示例库弹窗 - ExampleLibrary.tsx

**文件路径**: `src/components/ExampleLibrary.tsx`

```tsx
{/* 弹窗容器 */}
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
  <div className="w-[800px] h-[600px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">

    {/* 头部 */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700 shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">示例库</h2>
        <span className="text-sm text-gray-500 dark:text-slate-400">42 个示例</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="h-9 px-4 text-sm font-medium rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
          随机
        </button>
        <button className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          ✕
        </button>
      </div>
    </div>

    {/* 过滤器 */}
    <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-700 flex flex-wrap gap-2 items-center">
      <button className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
        全部
      </button>
      <button className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200">
        正确示例
      </button>
      {/* ... 更多过滤按钮 ... */}

      {/* 搜索框 */}
      <input
        type="text"
        placeholder="搜索..."
        className="h-9 px-4 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200"
      />
    </div>

    {/* 示例列表 */}
    <div className="flex-1 overflow-y-auto p-5">
      <div className="grid grid-cols-2 gap-4">
        {/* 示例卡片 */}
        <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-colors">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-medium text-gray-800 dark:text-slate-100">Node.js 多阶段构建</h3>
            <span className="text-xs px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">
              正确
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
            使用 alpine 镜像，包含依赖缓存优化...
          </p>
        </div>
      </div>
    </div>

    {/* 预览面板 */}
    <div className="h-[180px] border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 overflow-hidden">
      <div className="px-5 py-4 h-full">
        <pre className="text-sm font-mono bg-white dark:bg-slate-800 p-3 rounded-lg overflow-x-auto max-h-[100px] text-gray-700 dark:text-slate-300 border border-gray-100 dark:border-slate-700">
          FROM node:18-alpine
          WORKDIR /app
          ...
        </pre>
      </div>
    </div>
  </div>
</div>
```

---

## 8. API设置弹窗 - ApiKeyModal.tsx

**文件路径**: `src/components/ApiKeyModal.tsx`

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
  <div className="w-[480px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">

    {/* 头部 */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-700">
      <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">API 设置</h2>
      <button className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
        ✕
      </button>
    </div>

    {/* 内容 */}
    <div className="p-5 space-y-5">
      {/* AI 提供商 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
          AI 提供商
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button className="py-2 px-3 rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
            Claude
          </button>
          <button className="py-2 px-3 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 text-sm font-medium">
            OpenAI
          </button>
          <button className="py-2 px-3 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 text-sm font-medium">
            自定义
          </button>
        </div>
      </div>

      {/* 模型名称 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
          模型名称
        </label>
        <input
          type="text"
          className="w-full h-10 px-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm"
        />
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
          API Key
        </label>
        <input
          type="password"
          className="w-full h-10 px-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 text-sm"
        />
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm">
        <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">常用模型:</p>
        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
          <li>• 阿里云通义: qwen-turbo, qwen-plus</li>
          <li>• DeepSeek: deepseek-chat</li>
        </ul>
      </div>
    </div>

    {/* 底部按钮 */}
    <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
      <button className="h-10 px-5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
        取消
      </button>
      <button className="h-10 px-5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        保存
      </button>
    </div>
  </div>
</div>
```

---

## 11. 样式规范参考

### 颜色系统

```
背景色:
- 页面背景: bg-gray-50 / dark:bg-slate-900
- 卡片背景: bg-white / dark:bg-slate-800
- 边框: border-gray-100 / dark:border-slate-700
- 悬停背景: hover:bg-gray-50 / dark:hover:bg-slate-700

状态色 (极浅底色 + 中深色文字):
- 错误: bg-red-50 text-red-600
- 警告: bg-yellow-50 text-yellow-600
- 安全: bg-orange-50 text-orange-600
- 信息: bg-blue-50 text-blue-600
- 成功: bg-green-50 text-green-600

文字色:
- 主文字: text-gray-800 / dark:text-slate-100
- 次文字: text-gray-600 / dark:text-slate-300
- 弱文字: text-gray-500 / dark:text-slate-400
```

### 间距规范

```
- 页面边距: px-5 (20px)
- 卡片内边距: p-4 (16px)
- 按钮内边距: px-4 (16px)
- 元素间距: gap-2 (8px) / gap-3 (12px) / gap-4 (16px)
- 列表间距: space-y-3 (12px)
```

### 圆角规范

```
- 按钮: rounded-lg (8px)
- 卡片: rounded-xl (12px)
- 标签: rounded-md (6px)
- 弹窗: rounded-xl (12px)
```

### 按钮规格

```
高度:
- 标准按钮: h-9 (36px)
- 小按钮: h-8 (32px)

样式:
- 强调按钮: bg-blue-50 text-blue-600
- 边框按钮: border border-gray-200 bg-white
- 灰色按钮: bg-gray-100 text-gray-700
```

---

## 修改指南

如果您想修改某个组件的样式：

1. 找到对应的文件路径
2. 复制完整代码
3. 修改您想要调整的 Tailwind 类名
4. 将修改后的代码发给我，我会帮您更新文件

**常见修改示例**:

```tsx
// 修改按钮高度
- className="h-9 px-4"
+ className="h-10 px-5"

// 修改卡片圆角
- className="rounded-xl"
+ className="rounded-2xl"

// 修改间距
- className="px-5 py-4"
+ className="px-6 py-5"

// 修改状态颜色
- className="bg-red-50 text-red-600"
+ className="bg-rose-50 text-rose-600"
```