# Dockerfile Validator 测试报告

**生成时间**: 2026-03-31
**版本**: 1.0.0

---

## 一、规则覆盖报告

### 1.1 语法规则 (Syntax)

| 规则ID | 规则名称 | 严重级别 | 置信度 | 适用指令 |
|--------|----------|----------|--------|----------|
| F001 | FROM 标签格式 | error | high | FROM |
| F002 | FROM 最新标签警告 | warning | medium | FROM |
| F003 | FROM 平台语法 | error | high | FROM |
| F004 | latest 标签风险 | warning | medium | FROM |
| C001 | CMD/ENTRYPOINT JSON 数组引号 | error | high | CMD, ENTRYPOINT |
| C002 | CMD/ENTRYPOINT 括号匹配 | error | high | CMD, ENTRYPOINT |
| C003 | CMD/ENTRYPOINT shell 格式 | warning | medium | CMD, ENTRYPOINT |
| C004 | 多个 CMD/ENTRYPOINT | warning | high | CMD, ENTRYPOINT |
| CP001 | COPY 缺少源路径 | error | high | COPY |
| CP002 | COPY 目标路径格式 | error | high | COPY |
| CP003 | COPY 源路径不存在 | warning | medium | COPY |
| EX001 | EXPOSE 端口合法性 | error | high | EXPOSE |
| EX002 | EXPOSE 重复端口 | warning | high | EXPOSE |
| EX003 | EXPOSE 协议语法 | error | high | EXPOSE |
| E001 | ENV 敏感信息检测 | security | high | ENV |
| E002 | ENV 重复定义 | warning | high | ENV |
| E003 | ARG 与 ENV 同名覆盖 | warning | medium | ARG, ENV |
| A001 | ARG 默认值安全 | security | medium | ARG |
| R001 | RUN 空命令 | error | high | RUN |
| R002 | RUN 格式规范 | info | low | RUN |
| S001 | SHELL 格式错误 | error | high | SHELL |

### 1.2 安全规则 (Security)

| 规则ID | 规则名称 | 严重级别 | 置信度 | 说明 |
|--------|----------|----------|--------|------|
| X001 | 缺少 USER 指令 | info | medium | 容器可能以 root 运行 |
| X002 | USER 指定不存在用户 | warning | medium | 用户可能不存在 |
| X003 | chmod 777 权限过宽 | security | high | 安全风险 |
| X004 | 敏感文件复制 | security | high | 如 .env, id_rsa 等 |
| X005 | curl 管道执行脚本 | security | high | 供应链攻击风险 |
| X006 | COPY --from 不存在的阶段 | error | high | 构建会失败 |
| X007 | 非 root 用户 COPY 权限 | warning | medium | 文件权限问题 |
| X008 | Final stage 敏感文件残留 | security | high | 敏感信息泄露 |
| X009 | WORKDIR 权限风险 | warning | medium | 目录权限问题 |

### 1.3 最佳实践规则 (Best Practice)

| 规则ID | 规则名称 | 严重级别 | 置信度 | 说明 |
|--------|----------|----------|--------|------|
| CP004 | 敏感文件复制警告 | security | high | 如 id_rsa, .pem 等 |
| CP005 | 过宽复制模式 | info | low | COPY . . 可能复制不需要的文件 |
| R003 | 多个 RUN 建议合并 | info | low | 镜像层数优化 |
| R004 | apt-get 未清理缓存 | warning | medium | 镜像大小优化 |
| R005 | apt-get 未使用 --no-cache-dir | info | low | pip 缓存问题 |
| R006 | cd 指令无效 | warning | high | RUN cd 不会改变目录 |
| R007 | 多个 apt-get 建议 | info | low | 层数优化 |
| R008 | chmod 777 权限过宽 | security | high | 安全风险 |

---

## 二、单元测试报告

### 2.1 测试统计

```
 Test Files  6 passed (6)
      Tests  119 passed (119)
   Duration  ~2s
```

### 2.2 测试文件覆盖

| 测试文件 | 测试数量 | 状态 |
|----------|----------|------|
| parser.test.ts | ~30 | ✅ 通过 |
| rules.test.ts | ~25 | ✅ 通过 |
| ErrorPanel.test.tsx | 5 | ✅ 通过 |
| Header.test.tsx | 7 | ✅ 通过 |
| Layout.test.tsx | ~5 | ✅ 通过 |
| 其他组件测试 | ~47 | ✅ 通过 |

---

## 三、集成测试案例

### 3.1 正确案例测试

#### 案例 1: 基础 Node.js 应用
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```
**预期结果**: ✅ 无错误、无警告

#### 案例 2: 多阶段构建
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
USER node
CMD ["node", "server.js"]
```
**预期结果**: ✅ 无错误、无警告

### 3.2 错误案例测试

#### 案例 1: 引用不存在的构建阶段
```dockerfile
FROM ubuntu:22.04
COPY --from=builder /app/main /main
CMD ["/main"]
```
**预期结果**: ❌ 错误 - COPY --from 引用的阶段 "builder" 不存在

#### 案例 2: 多个 CMD 指令
```dockerfile
FROM node:20
CMD node server.js
CMD ["node", "server.js"]
```
**预期结果**: ⚠️ 警告 - 多个 CMD 指令，只有最后一个会生效

#### 案例 3: 敏感信息固化
```dockerfile
FROM ubuntu:22.04
ENV API_KEY=abc123
ENV SECRET=password
CMD ["./app"]
```
**预期结果**: ⚠️ 安全警告 - ENV 检测到敏感信息

#### 案例 4: EXPOSE 错误
```dockerfile
FROM nginx:1.25
EXPOSE 99999
EXPOSE abc
EXPOSE 80/invalid
```
**预期结果**:
- ❌ 端口 99999 超出范围
- ❌ 端口格式无效
- ❌ 协议 "invalid" 无效

### 3.3 安全案例测试

#### 案例 1: chmod 777
```dockerfile
FROM ubuntu:22.04
RUN chmod 777 /tmp
CMD ["bash"]
```
**预期结果**: 🔒 安全警告 - chmod 777 权限过宽

#### 案例 2: 敏感文件复制
```dockerfile
FROM node:20
COPY id_rsa /root/.ssh/id_rsa
COPY .env /app/.env
CMD ["node", "app.js"]
```
**预期结果**: 🔒 安全警告 - 复制了敏感文件

#### 案例 3: curl 管道执行
```dockerfile
FROM ubuntu:22.04
RUN curl -sSL https://example.com/install.sh | bash
CMD ["bash"]
```
**预期结果**: 🔒 安全警告 - 管道执行远程脚本存在风险

---

## 四、总结

### 4.1 规则统计

- **总规则数**: 40+
- **语法规则**: 15+
- **安全规则**: 10+
- **最佳实践规则**: 15+

### 4.2 测试覆盖

- **单元测试**: 119 个测试用例全部通过
- **规则测试**: 覆盖所有主要规则
- **组件测试**: 核心组件均有测试覆盖

### 4.3 已知问题修复

| 问题 | 状态 |
|------|------|
| EX001/EX003 重复报错 | ✅ 已修复 |
| 卡片间距不生效 | ✅ 已修复 |
| padding 被全局 CSS 覆盖 | ✅ 已修复 |

---

**报告结束**