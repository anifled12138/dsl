export interface Example {
  id: string
  name: string
  category: 'correct' | 'error' | 'warning' | 'mixed'
  description: string
  content: string
  expectedDiagnostics: {
    errors: number
    warnings: number
    infos: number
  }
}

export const EXAMPLES: Example[] = [
  // ==================== 正确示例 ====================
  {
    id: 'basic-node',
    name: '基础 Node.js 应用',
    category: 'correct',
    description: '标准的 Node.js 应用 Dockerfile',
    content: `# 基础 Node.js 应用
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'multi-stage',
    name: '多阶段构建',
    category: 'correct',
    description: '使用多阶段构建优化镜像大小',
    content: `# 多阶段构建最佳实践
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

CMD ["node", "server.js"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'nginx-static',
    name: 'Nginx 静态站点',
    category: 'correct',
    description: '使用 Nginx 托管静态文件',
    content: `FROM nginx:1.25-alpine

COPY ./html /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'python-app',
    name: 'Python 应用',
    category: 'correct',
    description: '标准 Python 应用 Dockerfile',
    content: `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "app.py"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'go-binary',
    name: 'Go 应用编译',
    category: 'correct',
    description: 'Go 应用多阶段构建',
    content: `FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY go.* ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o main .

FROM alpine:3.18

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'redis-cache',
    name: 'Redis 缓存服务',
    category: 'correct',
    description: 'Redis 配置示例',
    content: `FROM redis:7-alpine

COPY redis.conf /usr/local/etc/redis/redis.conf

EXPOSE 6379

CMD ["redis-server", "/usr/local/etc/redis/redis.conf"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'java-spring',
    name: 'Java Spring 应用',
    category: 'correct',
    description: 'Java Spring Boot 应用',
    content: `FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

COPY target/app.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'rust-release',
    name: 'Rust 发布构建',
    category: 'correct',
    description: 'Rust 应用多阶段构建',
    content: `FROM rust:1.75-alpine AS builder

WORKDIR /app

COPY Cargo.* ./
COPY src ./src

RUN cargo build --release

FROM alpine:3.18

WORKDIR /app

COPY --from=builder /app/target/release/myapp .

CMD ["./myapp"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },

  // ==================== 错误示例 ====================
  {
    id: 'missing-from',
    name: '缺少 FROM 指令',
    category: 'error',
    description: 'Dockerfile 必须包含 FROM 指令',
    content: `# 缺少 FROM 的错误示例
WORKDIR /app

COPY . .

RUN npm install

CMD ["node", "index.js"]`,
    expectedDiagnostics: { errors: 2, warnings: 0, infos: 0 }
  },
  {
    id: 'from-not-first',
    name: 'FROM 不在首行',
    category: 'error',
    description: 'FROM 必须是第一条非注释指令',
    content: `WORKDIR /app

FROM ubuntu:20.04

COPY . .`,
    expectedDiagnostics: { errors: 1, warnings: 0, infos: 0 }
  },
  {
    id: 'empty-dockerfile',
    name: '空 Dockerfile',
    category: 'error',
    description: '空文件测试',
    content: ``,
    expectedDiagnostics: { errors: 1, warnings: 0, infos: 0 }
  },
  {
    id: 'only-comments',
    name: '只有注释',
    category: 'error',
    description: '纯注释文件没有实际指令',
    content: `# 这只是一个注释
# 没有实际的构建指令
# 作者: 测试人员`,
    expectedDiagnostics: { errors: 1, warnings: 0, infos: 0 }
  },
  {
    id: 'from-not-first-with-blanks',
    name: 'FROM 前有指令和空行',
    category: 'error',
    description: 'FROM 前面有其他指令（即使有空行）',
    content: `WORKDIR /app

RUN echo test

FROM ubuntu:20.04`,
    expectedDiagnostics: { errors: 1, warnings: 0, infos: 0 }
  },
  {
    id: 'only-workdir',
    name: '只有 WORKDIR 没有 FROM',
    category: 'error',
    description: 'WORKDIR 必须在 FROM 之后',
    content: `WORKDIR /app`,
    expectedDiagnostics: { errors: 2, warnings: 0, infos: 0 }
  },
  {
    id: 'whitespace-only',
    name: '只有空白字符',
    category: 'error',
    description: '空白字符不是有效内容',
    content: `   \n\n   `,
    expectedDiagnostics: { errors: 1, warnings: 0, infos: 0 }
  },
  {
    id: 'newlines-only',
    name: '只有换行符',
    category: 'error',
    description: '换行符不是有效内容',
    content: `\n\n\n`,
    expectedDiagnostics: { errors: 1, warnings: 0, infos: 0 }
  },

  // ==================== 警告示例 ====================
  {
    id: 'latest-tag',
    name: '使用 latest 标签',
    category: 'warning',
    description: '不推荐使用 latest 标签',
    content: `FROM ubuntu:latest

RUN apt-get update

CMD ["bash"]`,
    expectedDiagnostics: { errors: 0, warnings: 1, infos: 0 }
  },
  {
    id: 'no-tag',
    name: '未指定镜像标签',
    category: 'warning',
    description: '应指定明确的镜像版本',
    content: `FROM node

WORKDIR /app

CMD ["node"]`,
    expectedDiagnostics: { errors: 0, warnings: 1, infos: 0 }
  },
  {
    id: 'multiple-latest',
    name: '多个 latest 标签',
    category: 'warning',
    description: '多个 FROM 都使用 latest',
    content: `FROM node:latest AS builder
WORKDIR /app

FROM nginx:latest
COPY --from=builder /app/build /usr/share/nginx/html`,
    expectedDiagnostics: { errors: 0, warnings: 2, infos: 0 }
  },
  {
    id: 'ubuntu-no-tag',
    name: 'Ubuntu 无标签',
    category: 'warning',
    description: 'Ubuntu 镜像未指定版本',
    content: `FROM ubuntu

RUN apt-get update

CMD ["bash"]`,
    expectedDiagnostics: { errors: 0, warnings: 1, infos: 0 }
  },
  {
    id: 'alpine-no-tag',
    name: 'Alpine 无标签',
    category: 'warning',
    description: 'Alpine 镜像未指定版本',
    content: `FROM alpine

RUN apk add --no-cache curl

CMD ["sh"]`,
    expectedDiagnostics: { errors: 0, warnings: 1, infos: 0 }
  },
  {
    id: 'variable-image',
    name: '变量镜像名',
    category: 'warning',
    description: '变量形式的镜像名无法确定标签',
    content: `FROM \${BASE_IMAGE}

WORKDIR /app

CMD ["./start.sh"]`,
    expectedDiagnostics: { errors: 0, warnings: 1, infos: 0 }
  },

  // ==================== 信息提示示例 ====================
  {
    id: 'too-many-blanks-1',
    name: '过多空行 (4行)',
    category: 'mixed',
    description: '连续空行过多',
    content: `FROM node:18-alpine




WORKDIR /app



COPY . .`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 2 }
  },
  {
    id: 'too-many-blanks-2',
    name: '过多空行 (5行)',
    category: 'mixed',
    description: '连续空行过多',
    content: `FROM node:18-alpine





WORKDIR /app`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 1 }
  },
  {
    id: 'three-blank-lines',
    name: '刚好3个空行',
    category: 'mixed',
    description: '3个连续空行触发提示',
    content: `FROM node:18-alpine



WORKDIR /app`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 1 }
  },
  {
    id: 'two-blank-lines',
    name: '2个空行不提示',
    category: 'correct',
    description: '2个连续空行是允许的',
    content: `FROM node:18-alpine


WORKDIR /app`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },

  // ==================== 混合示例 ====================
  {
    id: 'error-and-warning',
    name: '错误和警告混合',
    category: 'mixed',
    description: '同时包含错误和警告',
    content: `WORKDIR /app

FROM ubuntu:latest

COPY . .`,
    expectedDiagnostics: { errors: 1, warnings: 1, infos: 0 }
  },
  {
    id: 'all-types',
    name: '三种诊断混合',
    category: 'mixed',
    description: '包含错误、警告、信息提示',
    content: `# 注释
WORKDIR /app
FROM ubuntu:latest


RUN npm install



COPY . .`,
    expectedDiagnostics: { errors: 1, warnings: 1, infos: 1 }
  },
  {
    id: 'error-and-info',
    name: '错误和信息混合',
    category: 'mixed',
    description: '包含错误和信息提示',
    content: `WORKDIR /app

FROM node:18-alpine




COPY . .`,
    expectedDiagnostics: { errors: 1, warnings: 0, infos: 1 }
  },
  {
    id: 'warning-and-info',
    name: '警告和信息混合',
    category: 'mixed',
    description: '包含警告和信息提示',
    content: `FROM ubuntu:latest



WORKDIR /app`,
    expectedDiagnostics: { errors: 0, warnings: 1, infos: 1 }
  },

  // ==================== 边缘情况 ====================
  {
    id: 'case-insensitive',
    name: '大小写混合',
    category: 'correct',
    description: 'Dockerfile 指令不区分大小写',
    content: `fRoM ubuntu:20.04

woRkdIR /app

copy . .

cmd ["bash"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'with-arg',
    name: '使用 ARG 变量',
    category: 'correct',
    description: 'ARG 定义构建参数',
    content: `ARG NODE_VERSION=18

FROM node:\${NODE_VERSION}-alpine

WORKDIR /app

CMD ["node"]`,
    expectedDiagnostics: { errors: 0, warnings: 1, infos: 0 }
  },
  {
    id: 'private-registry',
    name: '私有仓库镜像',
    category: 'correct',
    description: '使用私有仓库的镜像',
    content: `FROM registry.example.com/myorg/myimage:v1.2.3

WORKDIR /app

CMD ["./start.sh"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'digest-image',
    name: '使用摘要拉取镜像',
    category: 'correct',
    description: '使用 SHA256 摘要指定镜像',
    content: `FROM ubuntu@sha256:abc123def456789

WORKDIR /app

CMD ["bash"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'comment-before-from',
    name: '注释在 FROM 之前',
    category: 'correct',
    description: '注释可以出现在 FROM 之前',
    content: `# 这是一个示例 Dockerfile
# 作者: 开发团队
# 版本: 1.0

FROM node:18-alpine

WORKDIR /app

CMD ["node"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'comment-and-blank-before-from',
    name: '注释和空行在 FROM 之前',
    category: 'correct',
    description: '注释和空行可以出现在 FROM 之前',
    content: `# 这是一个示例
# 多行注释

FROM node:18-alpine

CMD ["node"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'leading-spaces',
    name: '行首空格',
    category: 'correct',
    description: '行首空格不影响解析',
    content: `   FROM ubuntu:20.04

   WORKDIR /app

   CMD ["bash"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'trailing-spaces',
    name: '行尾空格',
    category: 'correct',
    description: '行尾空格不影响解析',
    content: `FROM ubuntu:20.04

WORKDIR /app

CMD ["bash"]   `,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'tab-separator',
    name: 'Tab 分隔符',
    category: 'correct',
    description: 'Tab 作为分隔符',
    content: `FROM	ubuntu:20.04

WORKDIR	/app

CMD	["bash"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'multiple-spaces',
    name: '多个空格分隔',
    category: 'correct',
    description: '多个空格作为分隔符',
    content: `FROM    ubuntu:20.04

WORKDIR    /app

CMD    ["bash"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'localhost-registry',
    name: '本地仓库镜像',
    category: 'correct',
    description: 'localhost 仓库的镜像',
    content: `FROM localhost:5000/myimage:v1

WORKDIR /app

CMD ["./start.sh"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'port-in-image',
    name: '带端口的镜像名',
    category: 'correct',
    description: '镜像名包含端口',
    content: `FROM myregistry.io:5000/image:tag

CMD ["./run"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'single-line',
    name: '单行 Dockerfile',
    category: 'correct',
    description: '最简单的 Dockerfile',
    content: `FROM alpine:3.18`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'from-as',
    name: 'FROM AS 语法',
    category: 'correct',
    description: '使用 AS 命名阶段',
    content: `FROM node:18-alpine AS base

FROM base AS builder
WORKDIR /app

FROM base AS runner
CMD ["node"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'platform-flag',
    name: '平台指定',
    category: 'correct',
    description: '指定构建平台',
    content: `FROM --platform=linux/amd64 node:18-alpine

WORKDIR /app

CMD ["node"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'comment-in-middle',
    name: '中间有注释',
    category: 'correct',
    description: '注释可以在任何位置',
    content: `FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制文件
COPY . .

# 启动命令
CMD ["node", "index.js"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },
  {
    id: 'dockerfile-with-crlf',
    name: 'Windows 换行符',
    category: 'correct',
    description: 'CRLF 换行符',
    content: `FROM node:18-alpine\r\nWORKDIR /app\r\nCMD ["node"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 0 }
  },

  // ==================== 新增错误示例 ====================
  {
    id: 'cmd-single-quotes',
    name: 'CMD 使用单引号',
    category: 'error',
    description: 'CMD JSON数组格式必须使用双引号',
    content: `FROM node:18-alpine

WORKDIR /app

CMD ['npm', 'start']`,
    expectedDiagnostics: { errors: 1, warnings: 0, infos: 0 }
  },
  {
    id: 'entrypoint-single-quotes',
    name: 'ENTRYPOINT 使用单引号',
    category: 'error',
    description: 'ENTRYPOINT JSON数组格式必须使用双引号',
    content: `FROM nginx:alpine

ENTRYPOINT ['nginx', '-g', 'daemon off;']`,
    expectedDiagnostics: { errors: 1, warnings: 0, infos: 0 }
  },
  {
    id: 'add-remote-url',
    name: 'ADD 从远端下载',
    category: 'warning',
    description: '不建议使用ADD从远端下载文件',
    content: `FROM ubuntu:20.04

ADD https://example.com/big-archive.tar.gz /tmp/

RUN tar -xzf /tmp/big-archive.tar.gz`,
    expectedDiagnostics: { errors: 0, warnings: 1, infos: 0 }
  },
  {
    id: 'apt-no-cache-clean',
    name: 'apt-get 未清理缓存',
    category: 'mixed',
    description: 'apt-get install 后未清理缓存',
    content: `FROM ubuntu:20.04

RUN apt-get update && apt-get install -y curl

CMD ["bash"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 1 }
  },
  {
    id: 'apk-no-no-cache',
    name: 'apk 未使用 --no-cache',
    category: 'mixed',
    description: 'apk add 未使用 --no-cache',
    content: `FROM alpine:3.18

RUN apk add curl

CMD ["sh"]`,
    expectedDiagnostics: { errors: 0, warnings: 0, infos: 1 }
  },
  {
    id: 'user-root',
    name: '切换到 root 用户',
    category: 'warning',
    description: '不建议切换到 root 用户',
    content: `FROM node:18-alpine

USER root

CMD ["node"]`,
    expectedDiagnostics: { errors: 0, warnings: 1, infos: 0 }
  },
]

// 获取随机示例
export function getRandomExample(): Example {
  const index = Math.floor(Math.random() * EXAMPLES.length)
  return EXAMPLES[index]
}

// 按分类获取示例
export function getExamplesByCategory(category: Example['category']): Example[] {
  return EXAMPLES.filter(e => e.category === category)
}

// 统计信息
export function getExampleStats() {
  return {
    total: EXAMPLES.length,
    correct: EXAMPLES.filter(e => e.category === 'correct').length,
    error: EXAMPLES.filter(e => e.category === 'error').length,
    warning: EXAMPLES.filter(e => e.category === 'warning').length,
    mixed: EXAMPLES.filter(e => e.category === 'mixed').length,
  }
}