# Dockerfile 校验器实现清单

## 一、统一输出协议

### 1.1 LintIssue 类型定义

```typescript
type LintIssue = {
  id: string;                 // 规则编号，如 R002
  title: string;              // 问题标题
  message: string;            // 问题说明
  suggestion?: string;        // 修复建议
  severity: "error" | "warning" | "security" | "info";
  confidence: "high" | "medium" | "low";
  line: number;
  column?: number;
  instruction?: string;       // 对应指令
  stage?: string;             // 所属阶段
  category: "syntax" | "security" | "best-practice" | "semantic";
};
```

### 1.2 规则元数据结构

```typescript
type RuleMeta = {
  id: string;
  name: string;
  description: string;
  category: "syntax" | "security" | "best-practice" | "semantic";
  severity: "error" | "warning" | "info";
  confidence: "high" | "medium" | "low";
  appliesTo: string[];        // 适用的指令
  rationale: string;          // 规则依据
  examples: {
    bad: string;              // 反例
    good: string;             // 正例
  };
};
```

---

## 二、Parser 结构化改造

### 2.1 指令结构

```typescript
type ParsedInstruction = {
  type: string;               // 指令类型（大写）
  rawText: string;            // 原始文本
  args: string;               // 参数部分
  normalizedArgs: string;     // 规范化参数（续行合并）
  lineStart: number;          // 起始行号
  lineEnd: number;            // 结束行号（续行情况）
  stageIndex: number;         // 阶段编号（0开始）
  stageAlias?: string;        // 阶段别名（FROM ... AS xxx）
  flags: Record<string, string>; // 解析的标志参数
};
```

### 2.2 Dockerfile AST 结构

```typescript
type DockerfileAST = {
  instructions: ParsedInstruction[];
  stages: {
    index: number;
    alias?: string;
    fromLine: number;
    instructions: number[];   // 指令索引
  }[];
  argBeforeFrom: string[];    // FROM 前的 ARG
};
```

---

## 三、测试集模板

### 3.1 测试用例结构

```typescript
type TestCase = {
  id: string;
  ruleId: string;
  type: "positive" | "negative" | "overlap";
  description: string;
  dockerfile: string;
  expectedIssues: {
    line: number;
    severity: string;
  }[];
};
```

---

## 四、第一梯队规则详细设计

### R001: curl|bash / wget|sh 安全警告

| 属性 | 值 |
|------|-----|
| ID | R001 |
| 名称 | 远程管道执行警告 |
| 类别 | security |
| 严重级别 | warning |
| 置信度 | high |
| 依据 | 直接从网络下载并执行脚本存在供应链攻击风险，无法验证脚本内容 |

**Bad Example:**
```dockerfile
FROM alpine:3.18
RUN curl https://example.com/script.sh | bash
```

**Good Example:**
```dockerfile
FROM alpine:3.18
RUN curl -o /tmp/script.sh https://example.com/script.sh && \
    sha256sum -c checksum.txt && \
    bash /tmp/script.sh && \
    rm /tmp/script.sh
```

---

### R002: sudo 使用警告

| 属性 | 值 |
|------|-----|
| ID | R002 |
| 名称 | sudo 使用警告 |
| 类别 | security |
| 严重级别 | warning |
| 置信度 | high |
| 依据 | 容器内应使用 USER 指令切换用户，而非 sudo。sudo 增加攻击面且可能导致权限问题 |

**Bad Example:**
```dockerfile
FROM ubuntu:20.04
RUN apt-get update && sudo apt-get install -y curl
```

**Good Example:**
```dockerfile
FROM ubuntu:20.04
USER root
RUN apt-get update && apt-get install -y curl
USER appuser
```

---

### R003: apt-get update 单独运行

| 属性 | 值 |
|------|-----|
| ID | R003 |
| 名称 | apt-get update 应与 install 合并 |
| 类别 | best-practice |
| 严重级别 | warning |
| 置信度 | high |
| 依据 | 单独的 apt-get update 会被 Docker 缓存，导致后续 install 使用过期索引 |

**Bad Example:**
```dockerfile
FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install -y curl
```

**Good Example:**
```dockerfile
FROM ubuntu:20.04
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
```

---

### R004: rm -rf / 警告

| 属性 | 值 |
|------|-----|
| ID | R004 |
| 名称 | 危险删除命令警告 |
| 类别 | security |
| 严重级别 | warning |
| 置信度 | medium |
| 依据 | rm -rf / 或 rm -rf /* 可能意外删除系统文件，通常不是预期行为 |

**Bad Example:**
```dockerfile
FROM alpine:3.18
RUN rm -rf /
```

**Good Example:**
```dockerfile
FROM alpine:3.18
RUN rm -rf /tmp/* /var/cache/*
```

---

### C003: shell form 警告

| 属性 | 值 |
|------|-----|
| ID | C003 |
| 名称 | CMD/ENTRYPOINT shell 格式警告 |
| 类别 | best-practice |
| 严重级别 | warning |
| 置信度 | medium |
| 依据 | shell form 会通过 /bin/sh -c 执行，导致信号传递问题，无法正确处理 SIGTERM |

**Bad Example:**
```dockerfile
FROM node:18-alpine
CMD node server.js
```

**Good Example:**
```dockerfile
FROM node:18-alpine
CMD ["node", "server.js"]
```

---

### X002: final stage 缺少 USER

| 属性 | 值 |
|------|-----|
| ID | X002 |
| 名称 | 最终阶段缺少非 root 用户 |
| 类别 | security |
| 严重级别 | warning |
| 置信度 | high |
| 依据 | 容器以 root 运行存在安全风险，应使用 USER 指定非特权用户 |

**Bad Example:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
CMD ["node", "server.js"]
```

**Good Example:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
USER node
CMD ["node", "server.js"]
```

---

### CP005: COPY . . 过宽复制警告

| 属性 | 值 |
|------|-----|
| ID | CP005 |
| 名称 | 过宽复制警告 |
| 类别 | security |
| 严重级别 | info |
| 置信度 | low |
| 依据 | COPY . . 可能复制敏感文件如 .git、.env、credentials 等 |

**Bad Example:**
```dockerfile
FROM node:18-alpine
COPY . .
RUN npm install
```

**Good Example:**
```dockerfile
FROM node:18-alpine
COPY package*.json ./
RUN npm install
COPY src/ ./src/
```

---

### CP006: 敏感文件复制警告

| 属性 | 值 |
|------|-----|
| ID | CP006 |
| 名称 | 敏感文件复制警告 |
| 类别 | security |
| 严重级别 | warning |
| 置信度 | high |
| 依据 | 复制敏感文件到镜像会导致安全问题，即使后续删除也会留在镜像层中 |

**敏感文件列表:**
- `.env`, `.env.*`
- `id_rsa`, `id_ed25519`, `*.pem`, `*.key`
- `.git/`, `.gitignore`
- `credentials.*`, `secrets.*`
- `*.p12`, `*.pfx`
- `node_modules/`

**Bad Example:**
```dockerfile
FROM node:18-alpine
COPY .env ./
COPY id_rsa /root/.ssh/
```

**Good Example:**
```dockerfile
FROM node:18-alpine
# 使用 .dockerignore 排除敏感文件
# 敏感信息应通过 secrets 或环境变量传递
```

---

### S002: COPY --from 自引用检测

| 属性 | 值 |
|------|-----|
| ID | S002 |
| 名称 | COPY --from 自引用错误 |
| 类别 | syntax |
| 严重级别 | error |
| 置信度 | high |
| 依据 | COPY --from 不能引用当前阶段，这会导致构建失败 |

**Bad Example:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=builder . .
```

**Good Example:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .

FROM alpine:3.18
COPY --from=builder /app/dist /app
```

---

### SUP001: 误报抑制 - 注释忽略

| 场景 | 处理 |
|------|------|
| 注释中包含敏感词 | `# PASSWORD=secret` 不报 ENV 敏感信息警告 |
| 注释中的示例 | `# Example: curl | bash` 不报管道执行警告 |

---

### SUP002: 误报抑制 - 字符串忽略

| 场景 | 处理 |
|------|------|
| 示例字符串 | `ENV EXAMPLE_TOKEN="your-token-here"` 不报敏感信息警告 |
| 占位符 | `${PASSWORD}` 变量引用不报敏感信息警告 |

---

## 五、实现步骤清单

### Step 1: 类型定义 (1h)
- [ ] 创建 `src/linter/types.ts`
- [ ] 定义 `LintIssue` 类型
- [ ] 定义 `RuleMeta` 类型
- [ ] 定义 `ParsedInstruction` 类型
- [ ] 定义 `DockerfileAST` 类型

### Step 2: Parser 重构 (2h)
- [ ] 创建 `src/linter/parser.ts`
- [ ] 实现指令解析（含续行处理）
- [ ] 实现阶段识别
- [ ] 实现 ARG 作用域识别
- [ ] 生成 AST 结构

### Step 3: 误报抑制模块 (1h)
- [ ] 创建 `src/linter/suppression.ts`
- [ ] 实现注释检测
- [ ] 实现示例字符串检测
- [ ] 实现变量引用检测

### Step 4: 规则去重模块 (0.5h)
- [ ] 创建 `src/linter/deduplication.ts`
- [ ] 实现 root 相关问题去重
- [ ] 实现相似问题合并

### Step 5: 第一梯队规则 (4h)
- [ ] R001: curl|bash 警告
- [ ] R002: sudo 警告
- [ ] R003: apt-get update 单独运行
- [ ] R004: rm -rf / 警告
- [ ] C003: shell form 警告
- [ ] X002: final stage 缺少 USER
- [ ] CP005: COPY . . 过宽复制
- [ ] CP006: 敏感文件复制
- [ ] S002: COPY --from 自引用

### Step 6: 测试集 (2h)
- [ ] 创建 positive cases
- [ ] 创建 negative cases
- [ ] 创建 overlap cases
- [ ] 运行测试验证

---

## 六、文件结构

```
src/linter/
├── index.ts              # 主入口
├── types.ts              # 类型定义
├── parser.ts             # Parser（第一层）
├── suppression.ts        # 误报抑制
├── deduplication.ts      # 规则去重
├── rules/
│   ├── index.ts          # 规则注册
│   ├── types.ts          # 规则类型
│   ├── instruction/      # 第二层：单指令规则
│   │   ├── from.ts
│   │   ├── run.ts
│   │   ├── cmd.ts
│   │   ├── copy.ts
│   │   └── ...
│   ├── cross-instruction/ # 第三层：跨指令规则
│   │   ├── user-check.ts
│   │   └── ...
│   └── cross-stage/      # 第四层：跨阶段规则
│       ├── stage-reference.ts
│       └── ...
└── test-cases/           # 测试用例
    ├── positive/
    ├── negative/
    └── overlap/
```