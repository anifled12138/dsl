# 前端界面设计文档

## 目录
1. [整体架构](#1-整体架构)
2. [页面布局](#2-页面布局)
3. [组件详解](#3-组件详解)
4. [样式规范](#4-样式规范)
5. [交互逻辑](#5-交互逻辑)
6. [暗色模式](#6-暗色模式)

---

## 1. 整体架构

### 1.1 技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS v4
- **代码编辑器**: Monaco Editor
- **测试**: Vitest + @testing-library/react

### 1.2 组件结构
```
src/
├── components/           # UI 组件
│   ├── Layout.tsx        # 页面布局容器
│   ├── Header.tsx        # 顶部导航栏
│   ├── CodeEditor.tsx    # Monaco 代码编辑器
│   ├── ErrorPanel.tsx    # 校验结果面板
│   ├── HistoryPanel.tsx  # 历史记录面板
│   ├── IssueDetailPanel.tsx  # 问题详情面板
│   ├── ExampleLibrary.tsx    # 示例库弹窗
│   ├── ApiKeyModal.tsx   # API 设置弹窗
│   ├── TestCaseModal.tsx # 新建案例弹窗
│   └── ThemeToggle.tsx   # 主题切换按钮
├── contexts/
│   └── ThemeContext.tsx  # 主题上下文
├── services/             # 业务服务
│   ├── aiFix.ts          # AI 修复服务
│   ├── export.ts         # 导出服务
│   └── history.ts        # 历史记录服务
└── types/
    └── index.ts          # 类型定义
```

---

## 2. 页面布局

### 2.1 三列布局结构

```
┌─────────────────────────────────────────────────────────────┐
│                        Header (h-14)                         │
│  [标题: Dockerfile 校验器]    [示例库] [新建案例] [全量测试] [主题] │
├──────────────────────┬──────────────────────┬───────────────┤
│                      │                      │               │
│    CodeEditor        │     ErrorPanel       │  HistoryPanel │
│    (flex-1)          │     (flex-1)         │   (w-80)      │
│                      │                      │               │
│    Monaco 编辑器      │    校验结果列表       │   历史卡片     │
│                      │    + 过滤器           │               │
│                      │    + 导出按钮         │               │
│                      │                      │               │
└──────────────────────┴──────────────────────┴───────────────┘
```

### 2.2 Layout.tsx 布局代码说明

```tsx
<div className="h-screen flex flex-col">
  {/* 顶部栏：固定高度 56px */}
  <header className="h-14 border-b ...">
    {header}
  </header>

  {/* 主内容区：三列 */}
  <main className="flex-1 flex overflow-hidden">
    {/* 左列：编辑器 - 弹性宽度 */}
    <section className="flex-1 min-w-0 border-r ...">
      {editor}
    </section>

    {/* 中列：校验结果 - 弹性宽度 */}
    <aside className="flex-1 min-w-0 border-r ...">
      {panel}
    </aside>

    {/* 右列：历史记录 - 固定宽度 320px */}
    <aside className="w-80 shrink-0 ...">
      {history}
    </aside>
  </main>
</div>
```

---

## 3. 组件详解

### 3.1 Header (顶部导航栏)

**文件**: `src/components/Header.tsx`

**布局**:
```
┌────────────────────────────────────────────────────────────┐
│  Dockerfile 校验器     [示例库] [新建案例] [全量测试] [主题] │
└────────────────────────────────────────────────────────────┘
```

**关键样式**:
```tsx
// 容器
<div className="flex items-center justify-between w-full gap-4">

// 标题
<h1 className="font-bold text-xl text-gray-800 dark:text-slate-100">

// 按钮（统一规格）
<button className="h-10 min-w-[88px] px-4 text-sm font-medium rounded-lg
  bg-slate-100 dark:bg-slate-700
  text-slate-700 dark:text-slate-200
  hover:bg-slate-200 dark:hover:bg-slate-600">

// 主题切换按钮（方形）
<button className="w-10 h-10 rounded-lg ...">
```

**按钮规格**:
| 属性 | 值 |
|------|-----|
| 高度 | h-10 (40px) |
| 最小宽度 | min-w-[88px] |
| 水平内边距 | px-4 (16px) |
| 圆角 | rounded-lg (8px) |
| 背景色 | bg-slate-100 (亮) / bg-slate-700 (暗) |

---

### 3.2 CodeEditor (代码编辑器)

**文件**: `src/components/CodeEditor.tsx`

**功能**:
- Monaco Editor 封装
- 行高亮（支持多行）
- 不同严重级别不同颜色
- 诊断标记（波浪线）

**高亮颜色配置**:
```tsx
const severityHighlightClasses = {
  error:    { line: 'highlighted-line-error',    glyph: 'highlighted-line-error-glyph' },
  security: { line: 'highlighted-line-security', glyph: 'highlighted-line-security-glyph' },
  warning:  { line: 'highlighted-line-warning',  glyph: 'highlighted-line-warning-glyph' },
  info:     { line: 'highlighted-line-info',     glyph: 'highlighted-line-info-glyph' },
}
```

**CSS 样式** (index.css):
```css
/* 错误 - 红色 */
.highlighted-line-error {
  background-color: rgba(239, 68, 68, 0.25) !important;
}
.highlighted-line-error-glyph {
  background-color: #ef4444;
  width: 4px !important;
  margin-left: 3px;
}

/* 安全 - 橙色 */
.highlighted-line-security {
  background-color: rgba(249, 115, 22, 0.25) !important;
}

/* 警告 - 黄色 */
.highlighted-line-warning {
  background-color: rgba(251, 191, 36, 0.25) !important;
}

/* 信息 - 蓝色 */
.highlighted-line-info {
  background-color: rgba(59, 130, 246, 0.15) !important;
}
```

---

### 3.3 ErrorPanel (校验结果面板)

**文件**: `src/components/ErrorPanel.tsx`

**布局结构**:
```
┌─────────────────────────────────────────┐
│ 校验结果          [导出] [过滤] [API]    │
├─────────────────────────────────────────┤
│ [● 校验通过/失败] [🔴2] [🔒1] [🟡3] [ℹ️0] │
├─────────────────────────────────────────┤
│ 🔴 错误                                  │
│    行 5:10  [F001]                       │
│    缺少 FROM 指令                        │
│    [🤖 AI 修复]                          │
├─────────────────────────────────────────┤
│ 🟡 警告                                  │
│    行 1:1  [F004]                        │
│    使用了 latest 标签                    │
└─────────────────────────────────────────┘
```

**头部按钮样式**:
```tsx
// 按钮容器 - 左移到合适位置
<div className="flex items-center gap-1">

// 按钮统一样式
<button className="h-10 px-4 text-sm rounded-lg
  text-gray-600 dark:text-slate-300
  hover:bg-gray-100 dark:hover:bg-slate-700">
```

**统计按钮样式**:
```tsx
// 激活状态 - 实色背景 + 白色文字 + 阴影
<button className={`... ${
  filters.severity.has('error')
    ? 'bg-red-500 text-white shadow-md'
    : 'bg-gray-100 text-gray-500'
}`}>

// 图标与数字间距
<span>🔴</span>
<span className="min-w-[16px] text-center">{errorCount}</span>
```

**严重级别图标**:
| 级别 | 图标 | 颜色 | 说明 |
|------|------|------|------|
| error | 🔴 | 红色 | 必须修复的错误 |
| security | 🔒 | 橙色 | 安全相关问题 |
| warning | 🟡 | 黄色 | 建议修复的警告 |
| info | ℹ️ | 蓝色 | 信息提示 |

---

### 3.4 HistoryPanel (历史记录面板)

**文件**: `src/components/HistoryPanel.tsx`

**卡片布局**:
```
┌─────────────────────────────────────┐
│ ● 通过/失败              时间戳  ✕   │
│ ┌─────────────────────────────────┐ │
│ │ FROM node:18-alpine            │ │
│ │ WORKDIR /app                   │ │
│ │ COPY . .                       │ │
│ └─────────────────────────────────┘ │
│          ● 2 错误    ● 3 警告        │
└─────────────────────────────────────┘
```

**卡片样式**:
```tsx
<div className={`
  p-4 rounded-2xl cursor-pointer
  transition-all duration-200
  ${selectedId === entry.id
    ? 'ring-2 ring-blue-500 shadow-lg'
    : 'shadow-sm hover:shadow-md'
  }
  ${entry.passed
    ? 'bg-green-50 dark:bg-green-900/30'
    : 'bg-red-50 dark:bg-red-900/30'
  }
`}>
```

---

### 3.5 IssueDetailPanel (问题详情面板)

**文件**: `src/components/IssueDetailPanel.tsx`

**布局结构**:
```
┌─────────────────────────────────────────┐
│ 🔴 问题详情                         ✕   │
├─────────────────────────────────────────┤
│ [F001] [错误] [高置信度] [最佳实践]      │
│                                          │
│ 📍 行 5:10  [FROM]  阶段: builder       │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 缺少 FROM 指令，Dockerfile 必须... │  │
│ └────────────────────────────────────┘  │
│                                          │
│ 💡 修复建议                              │
│ ┌────────────────────────────────────┐  │
│ │ 在文件开头添加 FROM 指令           │  │
│ │ [📋 复制] [✅ 应用]                │  │
│ └────────────────────────────────────┘  │
│                                          │
│ 📖 为什么存在此规则                      │
│ FROM 指令定义了基础镜像...               │
│                                          │
│ 📝 代码示例                              │
│ ┌──────────────┬──────────────┐         │
│ │ ❌ 反例       │ ✅ 正例       │         │
│ │ WORKDIR /app  │ FROM node:18 │         │
│ │ FROM node    │ WORKDIR /app │         │
│ └──────────────┴──────────────┘         │
└─────────────────────────────────────────┘
```

---

### 3.6 ExampleLibrary (示例库弹窗)

**文件**: `src/components/ExampleLibrary.tsx`

**布局结构**:
```
┌─────────────────────────────────────────────────────────┐
│ 示例库  (42个示例)                    [随机] [✕]         │
├─────────────────────────────────────────────────────────┤
│ [全部] [正确示例] [错误示例] [警告示例] [混合示例]        │
├─────────────────────────────────────────────────────────┤
│ [Node.js] [Python] [Nginx] [Go] [...] [搜索框]          │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────┬─────────────────────┐          │
│ │ 基础 Node.js应用  ✓  │ 多阶段构建      ✓   │          │
│ │ 标准的 Node.js...   │ 使用多阶段构建...   │          │
│ │ FROM node:18...     │ FROM node:18 AS...  │          │
│ └─────────────────────┴─────────────────────┘          │
├─────────────────────────────────────────────────────────┤
│ 预览面板（固定高度 180px）                               │
│ 基础 Node.js应用    [错误:0] [警告:0] [信息:0]           │
│ FROM node:18-alpine                                     │
│ WORKDIR /app                                            │
└─────────────────────────────────────────────────────────┘
```

**关键设计**:
- 预览面板**固定高度**，防止悬停时闪烁
- 无悬停时显示提示文字

```tsx
// 固定高度预览面板
<div className="h-[180px] border-t ...">
  {hoveredExample ? (
    <div>...详情内容...</div>
  ) : (
    <div className="flex items-center justify-center">
      悬停在示例上查看详情
    </div>
  )}
</div>
```

---

### 3.7 ApiKeyModal (API 设置弹窗)

**文件**: `src/components/ApiKeyModal.tsx`

**布局**:
```
┌───────────────────────────────────────┐
│ API 设置                           ✕  │
├───────────────────────────────────────┤
│ AI 提供商                              │
│ [Claude] [OpenAI] [自定义]            │
│                                        │
│ 模型名称                               │
│ ┌────────────────────────────────────┐│
│ │ claude-3-haiku-20240307            ││
│ └────────────────────────────────────┘│
│                                        │
│ API Key                                │
│ ┌────────────────────────────────────┐│
│ │ ••••••••••••                       ││
│ └────────────────────────────────────┘│
│                                        │
│ ┌────────────────────────────────────┐│
│ │ 常用模型:                          ││
│ │ • 阿里云通义: qwen-turbo...        ││
│ │ • DeepSeek: deepseek-chat...       ││
│ └────────────────────────────────────┘│
├───────────────────────────────────────┤
│                     [取消] [保存]      │
└───────────────────────────────────────┘
```

---

## 4. 样式规范

### 4.1 间距系统

| 位置 | Tailwind 类 | 像素值 |
|------|-------------|--------|
| 页面边距 | px-5 | 20px |
| 卡片内边距 | p-4 | 16px |
| 按钮内边距 | px-4 | 16px |
| 元素间距 | gap-2 | 8px |
| 列表间距 | gap-4 | 16px |

### 4.2 圆角规范

| 元素 | Tailwind 类 | 像素值 |
|------|-------------|--------|
| 按钮 | rounded-lg | 8px |
| 卡片 | rounded-xl / rounded-2xl | 12px / 16px |
| 输入框 | rounded-lg | 8px |
| 标签 | rounded / rounded-lg | 4px / 8px |

### 4.3 按钮规格

**主按钮 (Header)**:
```tsx
className="h-10 min-w-[88px] px-4 text-sm font-medium rounded-lg
  bg-slate-100 dark:bg-slate-700
  text-slate-700 dark:text-slate-200
  hover:bg-slate-200 dark:hover:bg-slate-600
  transition-colors"
```

**操作按钮 (面板内)**:
```tsx
className="h-8 px-4 text-sm rounded-lg
  text-gray-600 dark:text-slate-300
  hover:bg-gray-100 dark:hover:bg-slate-700"
```

**强调按钮**:
```tsx
className="h-10 px-5 bg-blue-500 text-white rounded-lg
  hover:bg-blue-600 transition-colors"
```

### 4.4 颜色系统

**背景色**:
| 用途 | 亮色模式 | 暗色模式 |
|------|---------|---------|
| 页面背景 | bg-gray-50 | bg-slate-900 |
| 卡片背景 | bg-white | bg-slate-800 |
| 边框 | border-gray-200 | border-slate-700 |
| 悬停背景 | hover:bg-gray-100 | hover:bg-slate-700 |

**文字色**:
| 用途 | 亮色模式 | 暗色模式 |
|------|---------|---------|
| 主文字 | text-gray-800 | text-slate-100 |
| 次文字 | text-gray-600 | text-slate-300 |
| 弱文字 | text-gray-400 | text-slate-500 |

**状态色**:
| 状态 | 颜色 |
|------|------|
| 错误 | red-500 |
| 安全 | orange-500 |
| 警告 | yellow-500 |
| 信息 | blue-500 |
| 成功 | green-500 |

---

## 5. 交互逻辑

### 5.1 代码编辑流程
```
用户编辑代码
  → 防抖 150ms
  → 调用 lintDockerfile()
  → 更新 diagnostics
  → ErrorPanel 显示结果
```

### 5.2 点击诊断项流程
```
点击诊断项
  → onErrorClick(line, lineEnd, severity)
  → editorRef.goToLine()
  → 滚动到对应行
  → 添加高亮效果 (2秒后消失)
```

### 5.3 过滤器交互
```
点击统计按钮
  → toggleSeverity(severity)
  → 更新 filters.severity Set
  → filteredDiagnostics 重新计算
  → 列表实时更新
```

### 5.4 示例库交互
```
打开示例库
  → 选择分类/技术栈/搜索
  → 悬停示例卡片
  → 底部预览面板显示详情（固定高度，不闪烁）
  → 点击示例
  → 关闭弹窗 + 插入代码到编辑器
```

---

## 6. 暗色模式

### 6.1 实现方式

**ThemeContext**:
```tsx
// src/contexts/ThemeContext.tsx
const [theme, setTheme] = useState<'light' | 'dark'>('dark')

// 应用到 HTML
useEffect(() => {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}, [theme])
```

### 6.2 Tailwind 配置

**index.css**:
```css
@custom-variant dark (&:where(.dark, .dark *));
```

### 6.3 暗色模式样式写法

```tsx
// 文字颜色
className="text-gray-800 dark:text-slate-100"

// 背景颜色
className="bg-white dark:bg-slate-800"

// 边框颜色
className="border-gray-200 dark:border-slate-700"

// 悬停状态
className="hover:bg-gray-100 dark:hover:bg-slate-700"
```

### 6.4 主题切换按钮

```tsx
// src/components/ThemeToggle.tsx
<button className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700
  hover:bg-gray-300 dark:hover:bg-gray-600">
  {/* 太阳图标 - 暗色模式显示 */}
  {/* 月亮图标 - 亮色模式显示 */}
</button>
```

---

## 附录：文件快速索引

| 功能 | 文件路径 |
|------|---------|
| 页面布局 | `src/components/Layout.tsx` |
| 顶部导航 | `src/components/Header.tsx` |
| 代码编辑器 | `src/components/CodeEditor.tsx` |
| 校验结果 | `src/components/ErrorPanel.tsx` |
| 问题详情 | `src/components/IssueDetailPanel.tsx` |
| 历史记录 | `src/components/HistoryPanel.tsx` |
| 示例库 | `src/components/ExampleLibrary.tsx` |
| API设置 | `src/components/ApiKeyModal.tsx` |
| 新建案例 | `src/components/TestCaseModal.tsx` |
| 主题切换 | `src/components/ThemeToggle.tsx` |
| 全局样式 | `src/index.css` |
| 类型定义 | `src/types/index.ts` |