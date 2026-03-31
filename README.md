# Dockerfile 在线校验器

一个专业的 Dockerfile 语法检查、安全审计和最佳实践建议工具。支持实时校验、AI 智能修复、丰富的示例库。

[在线使用](https://your-username.github.io/dsl/) | [规则文档](#规则库)

---

## 功能特性

### 核心功能

- **实时语法检查** - 输入即检查，即时反馈语法错误
- **安全漏洞检测** - 识别敏感信息泄露、权限过宽等安全问题
- **最佳实践建议** - 提供镜像优化、构建效率等改进建议
- **AI 智能修复** - 支持 OpenAI、Claude 等 AI 模型提供修复建议
- **示例库** - 内置多个最佳实践 Dockerfile 模板
- **历史记录** - 自动保存校验历史，方便回溯
- **深色/浅色主题** - 支持主题切换

### 校验能力

| 类别 | 规则数 | 说明 |
|------|--------|------|
| 语法规则 | 15+ | FROM、CMD、COPY 等指令语法检查 |
| 安全规则 | 12+ | 敏感信息、权限、用户等安全审计 |
| 最佳实践 | 15+ | 镜像优化、缓存策略、多阶段构建建议 |
| 跨指令规则 | 8+ | USER 检查、阶段依赖、敏感文件残留等 |

---

## 规则库

### FROM 指令规则

| 规则ID | 名称 | 级别 | 说明 |
|--------|------|------|------|
| F001 | 缺少 FROM 指令 | error | Dockerfile 必须包含 FROM 指令 |
| F002 | FROM 位置错误 | error | FROM 必须在第一条非注释行 |
| F003 | FROM 缺少镜像名 | error | 必须指定基础镜像名称 |
| F004 | latest 标签风险 | warning | 建议指定明确版本 |
| F005 | 镜像名使用变量 | warning | 变量引用无法静态验证 |
| F006 | stage 别名重复 | error | 多阶段构建别名不能重复 |

### CMD/ENTRYPOINT 规则

| 规则ID | 名称 | 级别 | 说明 |
|--------|------|------|------|
| C001 | JSON 数组引号错误 | error | 必须使用双引号 |
| C002 | 括号不匹配 | error | JSON 数组括号必须匹配 |
| C003 | shell 格式警告 | warning | 建议使用 exec 格式 |
| C004 | 多个 CMD/ENTRYPOINT | warning | 只有最后一个生效 |
| C006 | CMD+ENTRYPOINT 组合 | warning | 语义检查 |
| C007 | ENTRYPOINT shell+CMD | warning | 参数传递问题 |

### COPY/ADD 规则

| 规则ID | 名称 | 级别 | 说明 |
|--------|------|------|------|
| CP001 | 缺少路径参数 | error | 需要源和目标路径 |
| CP002 | ADD 远程 URL | warning | 建议用 curl 验证后执行 |
| CP003 | --from 引用检查 | error | 引用不存在的阶段 |
| CP004 | 敏感文件复制 | warning | 如 .env、id_rsa |
| CP005 | 过宽复制模式 | info | COPY . . 风险提示 |
| CP006 | --chown 建议 | info | USER 后 COPY 建议设置所有者 |

### RUN 规则

| 规则ID | 名称 | 级别 | 说明 |
|--------|------|------|------|
| R001 | 远程管道执行 | warning | curl | bash 供应链风险 |
| R002 | sudo 使用警告 | warning | 容器内应使用 USER 切换 |
| R003 | apt-get update 单独运行 | warning | 应与 install 合并 |
| R004 | apt-get 未清理缓存 | info | 镜像大小优化 |
| R005 | apt-get 缺少 -y | warning | 非交互环境需要 |
| R006 | apk 缺少 --no-cache | info | Alpine 缓存优化 |
| R007 | rm -rf / 危险 | warning | 危险删除命令 |
| R008 | chmod 777 | warning | 权限过宽 |
| R009 | cd 应使用 WORKDIR | warning | 目录切换建议 |
| R010-R012 | yum/dnf 相关 | warning/info | 包管理器最佳实践 |

### ENV/ARG 规则

| 规则ID | 名称 | 级别 | 说明 |
|--------|------|------|------|
| E001 | 敏感信息检测 | security | API_KEY、PASSWORD 等 |
| E002 | ENV 重复定义 | warning | 后者覆盖前者 |
| E003 | ARG 与 ENV 同名 | warning | 可能混淆 |
| A001 | FROM 中使用未定义 ARG | warning | 作用域问题 |
| A002 | ARG 跨阶段作用域 | warning | 需要重新声明 |
| A003 | 构建期变量误用 ENV | warning | 建议使用 ARG |

### EXPOSE 规则

| 规则ID | 名称 | 级别 | 说明 |
|--------|------|------|------|
| EX001 | 端口超出范围 | error | 端口必须在 1-65535 |
| EX002 | 重复端口暴露 | warning | 不必要的重复 |
| EX003 | 无效协议 | error | 只支持 tcp/udp |

### SHELL/STOPSIGNAL 规则

| 规则ID | 名称 | 级别 | 说明 |
|--------|------|------|------|
| S001 | SHELL 格式错误 | error | 必须使用 JSON 数组 |
| ST001 | STOPSIGNAL 无效 | error | 信号名称或编号无效 |

### 跨指令规则

| 规则ID | 名称 | 级别 | 说明 |
|--------|------|------|------|
| X002 | 缺少 USER 指令 | warning | 容器可能以 root 运行 |
| X003 | 用户切换异常 | warning | 切换后又切回 root |
| X004 | COPY 前缺少 WORKDIR | info | 建议先设置工作目录 |
| X005 | 缺少 HEALTHCHECK | info | 长期服务建议添加 |
| X006 | 连续 RUN 应合并 | info | 减少镜像层 |
| X007 | 连续空行过多 | info | 代码可读性 |
| X008 | 构建工具残留 | security | Final stage 不应有 gcc 等 |
| X009 | 敏感文件残留 | security | Final stage 不应有 .env 等 |
| X010 | 运行时工具残留 | warning | Final stage 检查 npm 等 |
| X011 | COPY 权限风险 | warning | 非 root 用户权限问题 |

---

## 技术栈

### 前端框架
- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具

### UI 组件
- **Monaco Editor** - 代码编辑器（VS Code 同款）
- **Tailwind CSS v4** - 样式框架

### 核心功能
- **dockerfile-ast** - Dockerfile AST 解析
- **自定义规则引擎** - 40+ 条校验规则

### 测试
- **Vitest** - 单元测试框架
- **Testing Library** - React 组件测试
- **100 个集成测试用例** - 全面覆盖各规则场景

---

## 本地开发

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 运行测试

```bash
# 单元测试
npm run test

# 集成测试（10个基础用例）
npm run test:integration

# 完整集成测试（100个用例）
npm run test:full

# 测试覆盖率
npm run test:coverage
```

---

## 项目结构

```
dsl/
├── src/
│   ├── components/          # React 组件
│   │   ├── CodeEditor.tsx   # Monaco 编辑器封装
│   │   ├── ErrorPanel.tsx   # 诊断结果面板
│   │   ├── ExampleLibrary.tsx # 示例库
│   │   ├── Header.tsx       # 头部导航
│   │   └── ...
│   ├── contexts/            # React Context
│   ├── linter/              # 核心校验引擎
│   │   ├── parser.ts        # Dockerfile 解析器
│   │   ├── rules/           # 规则实现
│   │   │   ├── instruction/ # 单指令规则
│   │   │   └── cross-instruction/ # 跨指令规则
│   │   └── index.ts         # 入口
│   ├── services/            # 服务层
│   │   ├── aiFix.ts         # AI 修复服务
│   │   ├── history.ts       # 历史记录
│   │   └── customTests.ts   # 自定义测试
│   ├── types/               # TypeScript 类型
│   └── App.tsx              # 主应用
├── scripts/
│   ├── integration-test.ts  # 基础集成测试
│   └── full-integration-test.ts # 完整集成测试
├── docs/
│   ├── DEPLOY_GUIDE.md      # 部署指南
│   ├── FULL_TEST_REPORT.md  # 测试报告
│   └── ...
└── .github/workflows/
    └── deploy.yml           # GitHub Actions 部署
```

---

## AI 修复支持

支持以下 AI 提供商：

- **OpenAI** - GPT-4、GPT-3.5
- **Anthropic** - Claude 系列
- **自定义 API** - 支持兼容 OpenAI 格式的 API

使用方法：
1. 点击右上角 "API 设置"
2. 选择提供商并输入 API Key
3. 在诊断结果中点击 "AI 修复"

---

## 示例 Dockerfile

### Node.js 应用

```dockerfile
ARG NODE_VERSION=18

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
EXPOSE 3000
HEALTHCHECK --interval=30s CMD curl -f http://localhost:3000/ || exit 1
USER node
CMD ["node", "server.js"]
```

---

## 贡献

欢迎提交 Issue 和 Pull Request！

### 添加新规则

1. 在 `src/linter/rules/` 下创建规则文件
2. 实现规则接口并导出
3. 在 `src/linter/rules/index.ts` 中注册
4. 添加测试用例

---

## 许可证

MIT License

---

## 致谢

- [dockerfile-ast](https://github.com/rcjsuen/dockerfile-ast) - Dockerfile AST 解析
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 代码编辑器
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架