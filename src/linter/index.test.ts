import { describe, it, expect } from 'vitest'
import { lintDockerfile } from './index'

describe('lintDockerfile', () => {
  // ==================== 空内容测试 ====================
  describe('空内容', () => {
    it('空字符串应报错"必须包含 FROM"', () => {
      const result = lintDockerfile('')
      expect(result).toHaveLength(1)
      expect(result[0].message).toContain('必须包含 FROM')
      expect(result[0].severity).toBe('error')
    })

    it('空白字符字符串应报错', () => {
      const result = lintDockerfile('   \n\n   ')
      expect(result).toHaveLength(1)
      expect(result[0].message).toContain('必须包含 FROM')
    })

    it('只有换行符应报错', () => {
      const result = lintDockerfile('\n\n\n')
      expect(result).toHaveLength(1)
      expect(result[0].severity).toBe('error')
    })
  })

  // ==================== FROM 指令位置测试 ====================
  describe('FROM 指令位置', () => {
    it('FROM 在首行（无注释）应通过', () => {
      const result = lintDockerfile('FROM ubuntu:20.04')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })

    it('FROM 在首行（有注释在前面）应通过', () => {
      const result = lintDockerfile('# 这是注释\nFROM ubuntu:20.04')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
      // FROM 在第 2 行，应该没有位置相关的错误
    })

    it('FROM 在注释和空行后应通过', () => {
      const result = lintDockerfile('# 注释\n\nFROM ubuntu:20.04')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })

    it('FROM 不在首行（前面有其他指令）应报错', () => {
      const result = lintDockerfile('WORKDIR /app\nFROM ubuntu:20.04')
      expect(result.some(r => r.message.includes('FROM 指令必须在'))).toBe(true)
      expect(result.find(r => r.message.includes('FROM 指令必须在'))?.line).toBe(1)
    })

    it('FROM 不在首行（前面只有空行）应通过', () => {
      // 空行不算指令，FROM 在空行后是允许的
      const result = lintDockerfile('\n\nFROM ubuntu:20.04')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })

    it('缺少 FROM 指令应报错', () => {
      const result = lintDockerfile('WORKDIR /app\nRUN npm install')
      expect(result.some(r => r.message.includes('必须包含 FROM'))).toBe(true)
    })
  })

  // ==================== FROM 指令格式/大小写测试 ====================
  describe('FROM 指令格式', () => {
    it('小写 from 应正确识别', () => {
      const result = lintDockerfile('from ubuntu:20.04')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })

    it('混合大小写 FrOm 应正确识别', () => {
      const result = lintDockerfile('FrOm ubuntu:20.04')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })

    it('FROM 后有多个空格应正确解析', () => {
      const result = lintDockerfile('FROM    ubuntu:20.04')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })

    it('FROM 后有 Tab 应正确解析', () => {
      const result = lintDockerfile('FROM\tubuntu:20.04')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })
  })

  // ==================== latest 标签测试 ====================
  describe('latest 标签警告', () => {
    it('FROM ubuntu（无标签）应警告', () => {
      const result = lintDockerfile('FROM ubuntu')
      expect(result.some(r => r.severity === 'warning' && r.message.includes('latest'))).toBe(true)
    })

    it('FROM ubuntu:latest 应警告', () => {
      const result = lintDockerfile('FROM ubuntu:latest')
      expect(result.some(r => r.severity === 'warning')).toBe(true)
      expect(result.find(r => r.severity === 'warning')?.line).toBe(1)
    })

    it('FROM ubuntu:20.04 应不警告', () => {
      const result = lintDockerfile('FROM ubuntu:20.04')
      expect(result.some(r => r.severity === 'warning')).toBe(false)
    })

    it('FROM ubuntu@sha256:xxx（digest 形式）应不警告', () => {
      const result = lintDockerfile('FROM ubuntu@sha256:abc123')
      expect(result.some(r => r.severity === 'warning')).toBe(false)
    })

    it('FROM node:18-alpine 应不警告', () => {
      const result = lintDockerfile('FROM node:18-alpine')
      expect(result.some(r => r.severity === 'warning')).toBe(false)
    })

    it('多个 FROM 都应检查标签', () => {
      const result = lintDockerfile('FROM ubuntu:latest\nFROM node:18')
      const warnings = result.filter(r => r.severity === 'warning')
      expect(warnings).toHaveLength(1) // 只有 ubuntu:latest 会警告
    })
  })

  // ==================== 镜像名测试 ====================
  describe('镜像名', () => {
    it('私有仓库镜像应正确解析', () => {
      const result = lintDockerfile('FROM registry.example.com/myimage:v1')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
      expect(result.some(r => r.severity === 'warning')).toBe(false)
    })

    it('localhost 镜像应正确解析', () => {
      const result = lintDockerfile('FROM localhost:5000/image:tag')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })

    it('带变量的 FROM 应不警告（无法确定）', () => {
      const result = lintDockerfile('FROM $IMAGE_NAME')
      // 变量情况不做 latest 警告检查
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })
  })

  // ==================== 空行测试 ====================
  describe('连续空行', () => {
    it('无空行应不报 info', () => {
      const result = lintDockerfile('FROM ubuntu:20.04\nWORKDIR /app')
      expect(result.some(r => r.severity === 'info')).toBe(false)
    })

    it('1 个空行应不报 info', () => {
      const result = lintDockerfile('FROM ubuntu:20.04\n\nWORKDIR /app')
      expect(result.some(r => r.severity === 'info')).toBe(false)
    })

    it('2 个空行应不报 info', () => {
      const result = lintDockerfile('FROM ubuntu:20.04\n\n\nWORKDIR /app')
      expect(result.some(r => r.severity === 'info')).toBe(false)
    })

    it('3+ 个连续空行应报 info', () => {
      const result = lintDockerfile('FROM ubuntu:20.04\n\n\n\nWORKDIR /app')
      expect(result.some(r => r.severity === 'info')).toBe(true)
      expect(result.find(r => r.severity === 'info')?.message).toContain('连续空行')
    })

    it('5 个连续空行应报 info', () => {
      const result = lintDockerfile('FROM ubuntu:20.04\n\n\n\n\n\nWORKDIR /app')
      expect(result.some(r => r.severity === 'info')).toBe(true)
    })

    it('文件末尾有空行不应报错', () => {
      const result = lintDockerfile('FROM ubuntu:20.04\n\n')
      expect(result.some(r => r.severity === 'error')).toBe(false)
    })
  })

  // ==================== 注释测试 ====================
  describe('注释', () => {
    it('纯注释文件应报错"必须包含 FROM"', () => {
      const result = lintDockerfile('# 只是注释\n# 另一行注释')
      expect(result.some(r => r.message.includes('必须包含 FROM'))).toBe(true)
    })

    it('注释后 FROM 应通过', () => {
      const result = lintDockerfile('# 作者: test\nFROM ubuntu:20.04')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })

    it('多行注释应正确跳过', () => {
      const result = lintDockerfile('# 第一行注释\n# 第二行注释\n# 第三行注释\nFROM ubuntu:20.04')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })

    it('注释中有 #FROM 不应误判', () => {
      const result = lintDockerfile('# FROM 是指令\nFROM ubuntu:20.04')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })
  })

  // ==================== 边缘字符测试 ====================
  describe('边缘字符', () => {
    it('行尾有空格的 FROM 应正确解析', () => {
      const result = lintDockerfile('FROM ubuntu:20.04   ')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })

    it('行首有空格的 FROM 应正确解析', () => {
      const result = lintDockerfile('   FROM ubuntu:20.04')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })

    it('Windows 换行符 CRLF 应正确处理', () => {
      const result = lintDockerfile('FROM ubuntu:20.04\r\nWORKDIR /app\r\n')
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })
  })

  // ==================== 混合场景测试 ====================
  describe('混合场景', () => {
    it('合法完整 Dockerfile 应无错误', () => {
      const dockerfile = `# 多阶段构建
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app .
CMD ["node", "index.js"]`
      const result = lintDockerfile(dockerfile)
      expect(result.filter(r => r.severity === 'error')).toHaveLength(0)
    })

    it('多个错误同时存在应全部报告', () => {
      const result = lintDockerfile(`WORKDIR /app
FROM ubuntu:latest
RUN npm install`)
      // 错误: FROM 不在首行
      // 警告: latest 标签
      expect(result.filter(r => r.severity === 'error')).toHaveLength(1)
      expect(result.filter(r => r.severity === 'warning')).toHaveLength(1)
    })

    it('错误 + 警告 + info 应全部正确分类', () => {
      const result = lintDockerfile(`# 注释
WORKDIR /app
FROM ubuntu:latest


RUN npm install



COPY . .`)
      expect(result.filter(r => r.severity === 'error')).toHaveLength(1) // FROM 不在首行
      expect(result.filter(r => r.severity === 'warning')).toHaveLength(1) // latest
      // 可能有多个 info（空行过多、WORKDIR 建议、连续 RUN 等）
      expect(result.filter(r => r.severity === 'info').length).toBeGreaterThanOrEqual(1)
    })

    it('返回的诊断信息应包含正确的行号', () => {
      const result = lintDockerfile('FROM ubuntu:latest')
      expect(result[0].line).toBe(1)
      expect(result[0].column).toBeGreaterThanOrEqual(1)
    })

    it('返回的诊断信息应包含消息', () => {
      const result = lintDockerfile('FROM ubuntu:latest')
      expect(result[0].message).toBeTruthy()
      expect(typeof result[0].message).toBe('string')
    })
  })
})