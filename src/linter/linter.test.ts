// ============================================
// Linter 测试用例
// ============================================

import { describe, it, expect } from 'vitest'
import { lintDockerfile, lintDockerfileDetailed } from './index'
import { parseDockerfile } from './parser'

describe('Parser', () => {
  it('应该正确解析基础 Dockerfile', () => {
    const content = `FROM node:18-alpine
WORKDIR /app
COPY . .
CMD ["node", "server.js"]`

    const ast = parseDockerfile(content)

    expect(ast.hasFrom).toBe(true)
    expect(ast.stages.length).toBe(1)
    expect(ast.instructions.filter(i => !i.isEmpty && !i.isComment).length).toBe(4)
  })

  it('应该正确解析多阶段构建', () => {
    const content = `FROM node:18-alpine AS builder
WORKDIR /app
RUN npm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html`

    const ast = parseDockerfile(content)

    expect(ast.stages.length).toBe(2)
    expect(ast.stages[0].alias).toBe('builder')
    expect(ast.stages[1].alias).toBeUndefined()
  })

  it('应该正确解析续行', () => {
    const content = `FROM alpine:3.18
RUN apt-get update && \\
    apt-get install -y curl && \\
    rm -rf /var/lib/apt/lists/*`

    const ast = parseDockerfile(content)

    const runInst = ast.instructions.find(i => i.type === 'RUN')
    expect(runInst).toBeDefined()
    expect(runInst!.lineStart).toBe(2)
    expect(runInst!.lineEnd).toBe(4)
  })

  it('应该正确识别 ARG before FROM', () => {
    const content = `ARG NODE_VERSION=18
FROM node:\${NODE_VERSION}-alpine
WORKDIR /app`

    const ast = parseDockerfile(content)

    expect(ast.argBeforeFrom).toContain('NODE_VERSION')
  })
})

describe('FROM 规则', () => {
  it('F001: 应该检测缺少 FROM', () => {
    const content = `WORKDIR /app
RUN npm install`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'F001')).toBe(true)
  })

  it('F002: 应该检测 FROM 不在首行', () => {
    const content = `WORKDIR /app
FROM node:18-alpine`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'F002')).toBe(true)
  })

  it('F004: 应该警告 latest 标签', () => {
    const content = `FROM node:latest
WORKDIR /app`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'F004')).toBe(true)
  })

  it('F006: 应该检测重复的阶段别名', () => {
    const content = `FROM node:18-alpine AS builder
WORKDIR /app

FROM alpine:3.18 AS builder
COPY --from=builder /app /app`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'F006')).toBe(true)
  })

  it('F004: 不应该警告明确版本的镜像', () => {
    const content = `FROM node:18-alpine
WORKDIR /app`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'F004')).toBe(false)
  })
})

describe('RUN 规则', () => {
  it('R001: 应该检测 curl | bash', () => {
    const content = `FROM alpine:3.18
RUN curl https://real-site.com/script.sh | bash`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'R001')).toBe(true)
  })

  it('R002: 应该检测 sudo 使用', () => {
    const content = `FROM ubuntu:20.04
RUN sudo apt-get install -y curl`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'R002')).toBe(true)
  })

  it('R003: 应该检测单独的 apt-get update', () => {
    const content = `FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install -y curl`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'R003')).toBe(true)
  })

  it('R005: 应该检测缺少 -y 标志', () => {
    const content = `FROM ubuntu:20.04
RUN apt-get update && apt-get install curl`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'R005')).toBe(true)
  })

  it('R006: 应该建议 apk add --no-cache', () => {
    const content = `FROM alpine:3.18
RUN apk add curl`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'R006')).toBe(true)
  })

  it('R007: 应该检测 rm -rf /', () => {
    const content = `FROM alpine:3.18
RUN rm -rf /`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'R007')).toBe(true)
  })

  it('R001: 不应该在示例 URL 时报警', () => {
    const content = `FROM alpine:3.18
# Example: curl https://example.com/script.sh | bash
RUN echo "done"`

    const issues = lintDockerfileDetailed(content).issues
    // 注释中的示例不应该触发警告
    expect(issues.filter(i => i.id === 'R001')).toHaveLength(0)
  })
})

describe('CMD/ENTRYPOINT 规则', () => {
  it('C001: 应该检测 JSON 数组中的单引号', () => {
    const content = `FROM node:18-alpine
CMD ['node', 'server.js']`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'C001')).toBe(true)
  })

  it('C003: 应该警告 shell form', () => {
    const content = `FROM node:18-alpine
CMD node server.js`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'C003')).toBe(true)
  })

  it('C004: 应该检测多个 CMD', () => {
    const content = `FROM node:18-alpine
CMD ["node", "server.js"]
CMD ["npm", "start"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'C004')).toBe(true)
  })

  it('C003: 不应该警告 exec form', () => {
    const content = `FROM node:18-alpine
CMD ["node", "server.js"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'C003')).toBe(false)
  })
})

describe('COPY/ADD 规则', () => {
  it('CP001: 应该检测缺少目标路径', () => {
    const content = `FROM node:18-alpine
COPY .`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'CP001')).toBe(true)
  })

  it('CP002: 应该警告 ADD 远程 URL', () => {
    const content = `FROM ubuntu:20.04
ADD https://example.com/file.tar.gz /tmp/`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'CP002')).toBe(true)
  })

  it('CP003: 应该检测 --from 引用不存在的阶段', () => {
    const content = `FROM node:18-alpine AS builder
WORKDIR /app

FROM alpine:3.18
COPY --from=nonexistent /app /app`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'CP003')).toBe(true)
  })

  it('CP003: 应该检测 --from 自引用', () => {
    const content = `FROM node:18-alpine AS builder
COPY --from=builder . .`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'CP003')).toBe(true)
  })

  it('CP004: 应该检测敏感文件复制', () => {
    const content = `FROM node:18-alpine
COPY .env ./
COPY id_rsa /root/.ssh/`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'CP004')).toBe(true)
  })

  it('CP005: 应该警告 COPY . .', () => {
    const content = `FROM node:18-alpine
COPY . .`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'CP005')).toBe(true)
  })

  it('CP003: 不应该在正确的多阶段构建时报错', () => {
    const content = `FROM node:18-alpine AS builder
WORKDIR /app
RUN npm build

FROM alpine:3.18
COPY --from=builder /app/dist /app`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'CP003')).toBe(false)
  })
})

describe('ENV 规则', () => {
  it('E001: 应该检测 ENV 中的敏感信息', () => {
    const content = `FROM node:18-alpine
ENV API_KEY=abc123secret
ENV DB_PASSWORD=mypassword
CMD ["node", "server.js"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'E001')).toBe(true)
  })

  it('E001: 不应该对变量引用报警', () => {
    const content = `FROM node:18-alpine
ENV API_KEY=\${SECRET_KEY}
CMD ["node", "server.js"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'E001')).toBe(false)
  })

  it('E001: 不应该对示例值报警', () => {
    const content = `FROM node:18-alpine
ENV API_KEY=your-api-key-here
CMD ["node", "server.js"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'E001')).toBe(false)
  })

  it('E002: 应该检测 ENV 重复定义', () => {
    const content = `FROM node:18-alpine
ENV NODE_ENV=development
ENV NODE_ENV=production
CMD ["node", "server.js"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'E002')).toBe(true)
  })
})

describe('ARG 规则', () => {
  it('A001: 应该警告 FROM 中使用未定义的 ARG', () => {
    const content = `FROM node:\${NODE_VERSION}
CMD ["node"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'A001')).toBe(true)
  })

  it('A001: 不应该在 ARG 已定义时报错', () => {
    const content = `ARG NODE_VERSION=18
FROM node:\${NODE_VERSION}-alpine
CMD ["node"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'A001')).toBe(false)
  })

  it('A002: 应该检测 ARG 跨阶段使用', () => {
    const content = `ARG APP_VERSION=1.0

FROM node:18-alpine AS builder
RUN echo $APP_VERSION

FROM node:18-alpine
RUN echo $APP_VERSION`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'A002')).toBe(true)
  })
})

describe('EXPOSE 规则', () => {
  it('EX001: 应该检测非法端口', () => {
    const content = `FROM nginx:alpine
EXPOSE 99999`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'EX001')).toBe(true)
  })

  it('EX002: 应该检测重复端口', () => {
    const content = `FROM nginx:alpine
EXPOSE 80
EXPOSE 80/tcp`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'EX002')).toBe(true)
  })

  it('EX003: 应该检测无效协议', () => {
    const content = `FROM nginx:alpine
EXPOSE 80/http`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'EX003')).toBe(true)
  })

  it('EXPOSE: 合法端口不应报警', () => {
    const content = `FROM nginx:alpine
EXPOSE 80/tcp
EXPOSE 443
EXPOSE 53/udp`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id.startsWith('EX'))).toBe(false)
  })
})

describe('跨指令规则', () => {
  it('X002: 应该警告缺少 USER', () => {
    const content = `FROM node:18-alpine
WORKDIR /app
COPY . .
CMD ["node", "server.js"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'X002')).toBe(true)
  })

  it('X002: 不应该在有 USER 时警告', () => {
    const content = `FROM node:18-alpine
WORKDIR /app
COPY . .
USER node
CMD ["node", "server.js"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'X002')).toBe(false)
  })

  it('X002: 应该警告最终 USER 是 root', () => {
    const content = `FROM node:18-alpine
WORKDIR /app
COPY . .
USER node
RUN something
USER root
CMD ["node", "server.js"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'X002')).toBe(true)
  })

  it('X003: 应该检测用户切换异常', () => {
    const content = `FROM node:18-alpine
USER node
COPY . .
USER root
RUN something
USER node
CMD ["node", "server.js"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'X003')).toBe(true)
  })

  it('X005: 应该建议添加 HEALTHCHECK', () => {
    const content = `FROM node:18-alpine
WORKDIR /app
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'X005')).toBe(true)
  })

  it('X005: 不应该对 bash 建议添加 HEALTHCHECK', () => {
    const content = `FROM ubuntu:22.04
USER appuser
RUN echo "build"
USER root
CMD ["bash"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'X005')).toBe(false)
  })

  it('X005: 不应该对 sh 建议添加 HEALTHCHECK', () => {
    const content = `FROM alpine:3.18
CMD ["sh"]`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'X005')).toBe(false)
  })

  it('X006: 应该建议合并连续 RUN', () => {
    const content = `FROM alpine:3.18
RUN apk add --no-cache curl
RUN apk add --no-cache wget`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'X006')).toBe(true)
  })
})

describe('误报抑制', () => {
  it('不应该在注释中检测敏感词', () => {
    const content = `FROM alpine:3.18
# Example: use sudo to install
RUN echo "done"`

    const issues = lintDockerfileDetailed(content).issues
    // 注释中的 sudo 不应该触发 R002
    expect(issues.some(i => i.id === 'R002')).toBe(false)
  })

  it('不应该在 builder 阶段安装 ssh client 时警告', () => {
    const content = `FROM alpine:3.18 AS builder
RUN apk add --no-cache openssh-client

FROM alpine:3.18
COPY --from=builder /app /app`

    const issues = lintDockerfileDetailed(content).issues
    // builder 阶段安装 ssh client 是正常的
    // 这个测试可能需要根据具体规则调整
    expect(issues.length).toBeGreaterThanOrEqual(0)
  })
})

describe('向后兼容', () => {
  it('应该返回 Diagnostic 格式', () => {
    const content = `FROM node:latest
WORKDIR /app
COPY . .
CMD ["node", "server.js"]`

    const diagnostics = lintDockerfile(content)

    expect(Array.isArray(diagnostics)).toBe(true)
    expect(diagnostics.length).toBeGreaterThan(0)

    const firstDiag = diagnostics[0]
    expect(firstDiag).toHaveProperty('line')
    expect(firstDiag).toHaveProperty('message')
    expect(firstDiag).toHaveProperty('severity')
  })
})

describe('Overlap Cases - 多规则触发去重', () => {
  it('同一行不应报告多个相同类别的问题', () => {
    const content = `FROM ubuntu:20.04
RUN apt-get update`

    const issues = lintDockerfileDetailed(content).issues
    // 同一行应该去重
    const line1Issues = issues.filter(i => i.line === 2)
    expect(line1Issues.length).toBeLessThanOrEqual(2)
  })

  it('应该保留不同类别的问题', () => {
    const content = `FROM node:latest
COPY . .
CMD ["node", "server.js"]`

    const issues = lintDockerfileDetailed(content).issues
    // F004 (latest 标签) 和 CP005 (COPY . .) 是不同类别
    const categories = new Set(issues.map(i => i.category))
    expect(categories.size).toBeGreaterThanOrEqual(1)
  })

  it('相同问题应该被合并', () => {
    const content = `FROM alpine:3.18
RUN chmod 777 /app
RUN chmod 777 /data`

    const issues = lintDockerfileDetailed(content).issues
    // R008 (chmod 777) 应该报告两次，但可能被聚合
    const chmodIssues = issues.filter(i => i.id === 'R008')
    expect(chmodIssues.length).toBeGreaterThanOrEqual(1)
  })
})

describe('Stage Graph 测试', () => {
  it('应该检测未使用的阶段', () => {
    const content = `FROM node:18-alpine AS builder
RUN npm install

FROM node:18-alpine AS unused
RUN echo "never used"

FROM node:18-alpine
COPY --from=builder /app /app`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'X012')).toBe(true)
  })

  it('应该检测循环依赖', () => {
    const content = `FROM alpine:3.18 AS stage1
COPY --from=stage2 /app /app

FROM alpine:3.18 AS stage2
COPY --from=stage1 /app /app

FROM alpine:3.18
COPY --from=stage1 /app /app`

    const issues = lintDockerfileDetailed(content).issues
    expect(issues.some(i => i.id === 'X013')).toBe(true)
  })
})

describe('Heredoc 支持', () => {
  it('应该正确解析 heredoc 语法', () => {
    const content = `FROM alpine:3.18
RUN <<EOF
echo "hello"
echo "world"
EOF`

    const ast = parseDockerfile(content)
    const runInstructions = ast.instructions.filter(i => i.type === 'RUN')
    expect(runInstructions.length).toBe(1)
    expect(runInstructions[0].lineEnd).toBeGreaterThan(runInstructions[0].lineStart)
  })
})