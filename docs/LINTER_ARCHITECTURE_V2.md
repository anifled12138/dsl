# Dockerfile 校验器规则库架构 V2

## 一、架构设计（四层模型）

```
┌─────────────────────────────────────────────────────────────┐
│                    第四层：跨阶段/语义规则                      │
│  (Cross-stage / Semantic Rules)                             │
│  - 多阶段构建完整性检查                                        │
│  - 敏感文件泄露检测                                            │
│  - ARG 作用域与泄露                                            │
│  - final stage 安全检查                                       │
├─────────────────────────────────────────────────────────────┤
│                    第三层：跨指令规则                          │
│  (Cross-instruction Rules)                                   │
│  - CMD/ENTRYPOINT 组合检查                                    │
│  - USER 与 COPY/RUN 联动                                      │
│  - WORKDIR 与 COPY 顺序                                       │
│  - HEALTHCHECK 缺失判断                                       │
├─────────────────────────────────────────────────────────────┤
│                    第二层：单指令局部规则                       │
│  (Instruction-local Rules)                                   │
│  - FROM 格式/版本检查                                          │
│  - RUN 安全/包管理检查                                         │
│  - CMD/ENTRYPOINT 格式检查                                    │
│  - 各指令语法验证                                              │
├─────────────────────────────────────────────────────────────┤
│                    第一层：解析规则                            │
│  (Parser Rules)                                              │
│  - 指令切分与识别                                              │
│  - 续行符处理                                                  │
│  - JSON 格式解析                                              │
│  - 注释处理                                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 二、规则分类详解

### 第一层：Parser Rules（解析规则）

负责将 Dockerfile 文本解析为结构化数据。

| 规则ID | 描述 | 级别 | 状态 |
|--------|------|------|------|
| P001 | 未知指令检测 | error | ✅ 已实现 |
| P002 | 指令拼写错误检测 | error | ✅ 已实现 |
| P003 | 续行符格式检查 | error | 待实现 |
| P004 | JSON 格式解析（引号/括号匹配） | error | ✅ 已实现 |
| P005 | 一行多指令检测 | error | ✅ 已实现 |
| P006 | 指令大小写一致性 | info | 待实现 |

### 第二层：Instruction-local Rules（单指令局部规则）

#### FROM 指令

| 规则ID | 描述 | 级别 | 状态 |
|--------|------|------|------|
| F001 | 缺少 FROM 指令 | error | ✅ 已实现 |
| F002 | FROM 不在首行 | error | ✅ 已实现 |
| F003 | 缺少镜像名称 | error | ✅ 已实现 |
| F004 | latest 标签警告 | warning | ✅ 已实现 |
| F005 | 镜像名使用变量 | warning | ✅ 已实现 |
| F006 | stage 别名重复检测 | warning | 待实现 |
| F007 | digest pinning 建议 | info | 待实现 |

#### RUN 指令

| 规则ID | 描述 | 级别 | 状态 |
|--------|------|------|------|
| R001 | curl/wget 管道执行 | warning | ✅ 已实现 |
| R002 | sudo 使用警告 | warning | 待实现 |
| R003 | SSH 使用警告 | warning | 待实现 |
| R004 | apt-get update 单独运行 | warning | 待实现 |
| R005 | apt-get install 缓存清理 | info | ✅ 已实现 |
| R006 | apt-get install -y 标志 | warning | 待实现 |
| R007 | apt-get install 版本固定 | warning | 待实现 |
| R008 | apk add --no-cache | info | ✅ 已实现 |
| R009 | apk add 版本固定 | warning | 待实现 |
| R010 | yum/dnf 缓存清理 | info | 待实现 |
| R011 | yum/dnf -y 标志 | warning | 待实现 |
| R012 | pip install 版本固定 | warning | 待实现 |
| R013 | npm install 版本固定 | warning | 待实现 |
| R014 | npm ci 建议 | info | 待实现 |
| R015 | rm -rf / 警告 | warning | 待实现 |
| R016 | chmod 777 警告 | warning | 待实现 |
| R017 | cd 命令应使用 WORKDIR | warning | 待实现 |

#### CMD/ENTRYPOINT 指令

| 规则ID | 描述 | 级别 | 状态 |
|--------|------|------|------|
| C001 | JSON 数组单引号错误 | error | ✅ 已实现 |
| C002 | 方括号/双引号匹配 | error | ✅ 已实现 |
| C003 | shell form 格式警告 | warning | 待实现 |
| C004 | 多个 CMD 覆盖警告 | warning | ✅ 已实现 |
| C005 | 多个 ENTRYPOINT 覆盖警告 | warning | ✅ 已实现 |

#### COPY/ADD 指令

| 规则ID | 描述 | 级别 | 状态 |
|--------|------|------|------|
| CP001 | 缺少源/目标路径 | error | ✅ 已实现 |
| CP002 | ADD 远程 URL 警告 | warning | ✅ 已实现 |
| CP003 | ADD 自动解压提示 | info | 待实现 |
| CP004 | --chown 建议使用 | info | 待实现 |
| CP005 | COPY . . 过宽复制警告 | warning | 待实现 |
| CP006 | 敏感文件复制警告 | warning | 待实现 |

#### EXPOSE 指令

| 规则ID | 描述 | 级别 | 状态 |
|--------|------|------|------|
| E001 | 端口号格式验证 | error | ✅ 已实现 |
| E002 | 端口号范围验证 | error | ✅ 已实现 |
| E003 | 端口重复暴露 | warning | 待实现 |
| E004 | 敏感端口暴露提示 | info | 待实现 |

#### WORKDIR 指令

| 规则ID | 描述 | 级别 | 状态 |
|--------|------|------|------|
| W001 | 缺少目录路径 | error | ✅ 已实现 |
| W002 | 应使用绝对路径 | warning | ✅ 已实现 |

#### ENV 指令

| 规则ID | 描述 | 级别 | 状态 |
|--------|------|------|------|
| EN001 | 敏感信息检测 | warning | ✅ 已实现 |
| EN002 | 重复定义检测 | warning | 待实现 |
| EN003 | 空值检测 | warning | 待实现 |
| EN004 | 应使用 ARG 存储构建期值 | info | 待实现 |

#### USER 指令

| 规则ID | 描述 | 级别 | 状态 |
|--------|------|------|------|
| U001 | 切换到 root 警告 | warning | ✅ 已实现 |

#### 其他指令

| 规则ID | 指令 | 描述 | 级别 | 状态 |
|--------|------|------|------|------|
| O001 | HEALTHCHECK | 格式验证 | error | 待实现 |
| O002 | ARG | 格式验证 | warning | 待实现 |
| O003 | LABEL | 格式验证 | warning | 待实现 |
| O004 | VOLUME | 路径格式验证 | warning | 待实现 |
| O005 | STOPSIGNAL | 信号格式验证 | error | 待实现 |
| O006 | SHELL | JSON 格式验证 | error | 待实现 |
| O007 | MAINTAINER | 已废弃警告 | warning | 待实现 |

### 第三层：Cross-instruction Rules（跨指令规则）

| 规则ID | 描述 | 级别 | 状态 |
|--------|------|------|------|
| X001 | CMD 与 ENTRYPOINT 组合语义检查 | warning | 待实现 |
| X002 | 最终 USER 检查（容器是否以 root 运行） | warning | 待实现 |
| X003 | USER 切换后又切回 root | warning | 待实现 |
| X004 | COPY 与 USER 权限配合检查 | warning | 待实现 |
| X005 | WORKDIR 在 COPY 之前设置检查 | info | 待实现 |
| X006 | 长期运行服务缺少 HEALTHCHECK | info | 待实现 |
| X007 | CMD/ENTRYPOINT 前缺少 USER | warning | 待实现 |
| X008 | 连续 RUN 指令合并建议 | info | 待实现 |
| X009 | ENV/ARG 重复定义检测 | warning | 待实现 |
| X010 | LABEL 重复定义检测 | warning | 待实现 |

### 第四层：Cross-stage/Semantic Rules（跨阶段/语义规则）

| 规则ID | 描述 | 级别 | 状态 |
|--------|------|------|------|
| S001 | COPY --from 引用的 stage 存在性 | error | ✅ 已实现 |
| S002 | COPY --from 自引用检测 | error | 待实现 |
| S003 | 多阶段构建 stage 别名重复 | warning | 待实现 |
| S004 | final stage 敏感文件泄露检测 | warning | 待实现 |
| S005 | final stage 仍是 build image 警告 | info | 待实现 |
| S006 | ARG 在 FROM 前后作用域检查 | warning | 待实现 |
| S007 | ARG 值泄露到镜像层 | warning | 待实现 |
| S008 | 多阶段中 ARG 传递完整性 | warning | 待实现 |

---

## 三、误报控制机制

### 1. 规则置信度分层

```typescript
enum Confidence {
  HIGH = 'high',     // 确定是问题，直接报 error
  MEDIUM = 'medium', // 很可能是问题，报 warning
  LOW = 'low'        // 可能是问题，报 info
}
```

### 2. 误报抑制规则

| 场景 | 处理方式 |
|------|----------|
| 注释中包含敏感词 | 忽略，不报敏感信息警告 |
| 字符串中的 token 示例 | 忽略，如 "your-token-here" |
| builder stage 安装 SSH client | 不等同于 final image 有风险 |
| 示例代码中的密码 | 检测 "example"、"sample"、"demo" 关键词 |
| 环境变量引用 `${VAR}` | 不报硬编码警告 |

### 3. 规则去重机制

| 问题 | 相关规则 | 处理方式 |
|------|----------|----------|
| root 运行问题 | U001, X002, X007 | 只报最高优先级的一条 |
| 缺少 USER | X002, X007 | 合并为一条 |
| final stage root | S005, X002 | 合并为一条 |

---

## 四、实现优先级（按分析文档建议的10个重点）

### 第一优先级（必须实现）

| 序号 | 规则 | 描述 | 工作量 |
|------|------|------|--------|
| 1 | X002 | final stage 是否缺少 USER | 中 |
| 2 | C003 | shell form vs exec form 警告 | 低 |
| 3 | R002 | sudo 使用警告 | 低 |
| 4 | R004 | apt-get update 单独运行警告 | 中 |
| 5 | R015 | rm -rf / 警告 | 低 |
| 6 | O007 | MAINTAINER 废弃警告 | 低 |
| 7 | CP005-006 | 敏感文件复制警告 | 中 |
| 8 | S002 | COPY --from 自引用检测 | 低 |
| 9 | S006 | ARG 作用域检查 | 中 |
| 10 | 误报控制 | 注释/字符串场景处理 | 中 |

### 第二优先级（包管理器规则）

| 序号 | 规则 | 描述 | 工作量 |
|------|------|------|--------|
| 1 | R006 | apt-get install -y 标志 | 低 |
| 2 | R007 | apt-get install 版本固定 | 中 |
| 3 | R009 | apk add 版本固定 | 中 |
| 4 | R010-011 | yum/dnf 规则 | 中 |
| 5 | R012 | pip install 版本固定 | 中 |
| 6 | R013-014 | npm 规则 | 中 |

### 第三优先级（其他跨指令规则）

| 序号 | 规则 | 描述 | 工作量 |
|------|------|------|--------|
| 1 | X001 | CMD/ENTRYPOINT 组合检查 | 中 |
| 2 | X003 | USER 切换后又切回 root | 中 |
| 3 | X004 | COPY 与 USER 权限配合 | 中 |
| 4 | X006 | 长期服务缺少 HEALTHCHECK | 中 |
| 5 | X008 | 连续 RUN 合并建议 | 中 |

---

## 五、架构重构计划

### 阶段一：误报控制基础设施（1天）

```typescript
// 新建 src/linter/rules/ 目录结构
src/linter/
├── index.ts              // 主入口
├── parser.ts             // 第一层：解析规则
├── rules/
│   ├── instruction/      // 第二层：单指令规则
│   │   ├── from.ts
│   │   ├── run.ts
│   │   ├── cmd.ts
│   │   └── ...
│   ├── cross-instruction/ // 第三层：跨指令规则
│   │   ├── user-check.ts
│   │   ├── cmd-entrypoint.ts
│   │   └── ...
│   └── cross-stage/      // 第四层：跨阶段规则
│       ├── stage-reference.ts
│       ├── arg-scope.ts
│       └── ...
├── suppression.ts        // 误报抑制
└── deduplication.ts      // 规则去重
```

### 阶段二：核心规则实现（2天）

实现第一优先级的10个规则

### 阶段三：包管理器规则（1天）

实现第二优先级的包管理器规则

### 阶段四：跨指令规则（1天）

实现第三优先级的跨指令规则

---

## 六、总计

| 阶段 | 内容 | 时间 | 规则数 |
|------|------|------|--------|
| 阶段一 | 误报控制基础设施 | 1天 | - |
| 阶段二 | 核心规则（10个重点） | 2天 | 10个 |
| 阶段三 | 包管理器规则 | 1天 | 9个 |
| 阶段四 | 跨指令规则 | 1天 | 5个 |
| **总计** | | **5天** | **24个新规则** |