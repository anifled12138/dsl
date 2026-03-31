/**
 * Dockerfile Linter 集成测试脚本
 *
 * 运行方式: npx ts-node scripts/integration-test.ts
 * 或者: node --loader ts-node/esm scripts/integration-test.ts
 */

import { lintDockerfile } from '../src/linter'

interface TestCase {
  name: string
  description: string
  dockerfile: string
  expectedErrors: number
  expectedWarnings: number
  expectedSecurity: number
}

const testCases: TestCase[] = [
  // ==================== 正确案例 ====================
  {
    name: '正确: 基础 Node.js 应用',
    description: '标准的 Node.js 应用 Dockerfile，会有 USER 和 COPY 相关的建议',
    dockerfile: `FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]`,
    expectedErrors: 0,
    expectedWarnings: 1, // USER 指令建议
    expectedSecurity: 0,
  },
  {
    name: '正确: 多阶段构建',
    description: '使用多阶段构建，会有 COPY 权限相关警告',
    dockerfile: `FROM node:18-alpine AS builder
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
    expectedErrors: 0,
    expectedWarnings: 3, // node_modules 安全警告, 两处 COPY 权限警告
    expectedSecurity: 0,
  },

  // ==================== 错误案例 ====================
  {
    name: '错误: 引用不存在的构建阶段',
    description: 'COPY --from 引用了不存在的阶段别名',
    dockerfile: `FROM ubuntu:22.04
COPY --from=builder /app/main /main
CMD ["/main"]`,
    expectedErrors: 1,
    expectedWarnings: 1, // USER 指令建议
    expectedSecurity: 0,
  },
  {
    name: '错误: EXPOSE 端口超范围',
    description: '端口号超出 1-65535 范围',
    dockerfile: `FROM nginx:alpine
EXPOSE 99999`,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedSecurity: 0,
  },
  {
    name: '错误: EXPOSE 无效协议',
    description: '协议只能是 tcp 或 udp',
    dockerfile: `FROM nginx:alpine
EXPOSE 80/http`,
    expectedErrors: 1,
    expectedWarnings: 0,
    expectedSecurity: 0,
  },

  // ==================== 警告案例 ====================
  {
    name: '警告: 多个 CMD 指令',
    description: '只有最后一个 CMD 会生效，同时有 shell 格式和 USER 建议',
    dockerfile: `FROM node:20
CMD node server.js
CMD ["node", "server.js"]`,
    expectedErrors: 0,
    expectedWarnings: 3, // shell 格式警告, 多个 CMD, USER 建议
    expectedSecurity: 0,
  },
  {
    name: '警告: 使用 latest 标签',
    description: 'latest 标签可能导致不可重复的构建',
    dockerfile: `FROM node:latest
WORKDIR /app
COPY . .
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 2, // latest 标签警告, USER 建议
    expectedSecurity: 0,
  },

  // ==================== 安全案例 ====================
  {
    name: '安全: chmod 777 权限过宽',
    description: '给所有用户读写执行权限存在安全风险',
    dockerfile: `FROM ubuntu:22.04
RUN chmod 777 /tmp
CMD ["bash"]`,
    expectedErrors: 0,
    expectedWarnings: 2, // chmod 777 警告, USER 建议
    expectedSecurity: 0,
  },
  {
    name: '安全: ENV 敏感信息',
    description: '环境变量名包含敏感关键词',
    dockerfile: `FROM ubuntu:22.04
ENV API_KEY=abc123
ENV SECRET=password
CMD ["./app"]`,
    expectedErrors: 0,
    expectedWarnings: 1, // USER 建议
    expectedSecurity: 2, // API_KEY 和 SECRET 安全警告
  },
  {
    name: '安全: 复制敏感文件',
    description: '复制私钥等敏感文件',
    dockerfile: `FROM node:20
COPY id_rsa /root/.ssh/id_rsa
CMD ["node", "app.js"]`,
    expectedErrors: 0,
    expectedWarnings: 2, // id_rsa 复制警告, USER 建议
    expectedSecurity: 1, // Final stage 敏感文件安全警告
  },
]

// 运行测试
function runTests() {
  console.log('=' .repeat(60))
  console.log('Dockerfile Linter 集成测试')
  console.log('=' .repeat(60))
  console.log()

  let passed = 0
  let failed = 0

  for (const tc of testCases) {
    const diagnostics = lintDockerfile(tc.dockerfile)
    const actualErrors = diagnostics.filter(d => d.severity === 'error').length
    const actualWarnings = diagnostics.filter(d => d.severity === 'warning').length
    const actualSecurity = diagnostics.filter(d => d.severity === 'security').length

    const errorMatch = actualErrors === tc.expectedErrors
    const warningMatch = actualWarnings === tc.expectedWarnings
    const securityMatch = actualSecurity === tc.expectedSecurity
    const allMatch = errorMatch && warningMatch && securityMatch

    if (allMatch) {
      passed++
      console.log(`✅ ${tc.name}`)
    } else {
      failed++
      console.log(`❌ ${tc.name}`)
      console.log(`   描述: ${tc.description}`)
      console.log(`   预期: ${tc.expectedErrors} 错误, ${tc.expectedWarnings} 警告, ${tc.expectedSecurity} 安全`)
      console.log(`   实际: ${actualErrors} 错误, ${actualWarnings} 警告, ${actualSecurity} 安全`)
      if (diagnostics.length > 0) {
        console.log('   诊断详情:')
        diagnostics.forEach(d => {
          console.log(`     - 行 ${d.line}: [${d.severity}] ${d.message}`)
        })
      }
    }
  }

  console.log()
  console.log('=' .repeat(60))
  console.log(`测试结果: ${passed} 通过, ${failed} 失败`)
  console.log('=' .repeat(60))

  return failed === 0
}

// 执行
runTests()