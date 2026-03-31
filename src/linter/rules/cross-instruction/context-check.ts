// ============================================
// .dockerignore 提醒规则
// ============================================

import { Rule, DockerfileAST, LintIssue } from '../../types'

// X014: 缺少 .dockerignore 提醒
const ruleX014: Rule = {
  meta: {
    id: 'X014',
    name: '缺少 .dockerignore 提醒',
    description: '检测可能需要 .dockerignore 的场景',
    category: 'best-practice',
    severity: 'info',
    confidence: 'low',
    appliesTo: ['COPY', 'ADD'],
    rationale: '.dockerignore 文件可以排除不需要的文件，减小构建上下文大小，避免复制敏感文件（如 .git、.env、node_modules）到镜像中。',
    examples: {
      bad: `FROM node:18-alpine
COPY . .
RUN npm install`,
      good: `# .dockerignore
.git
.gitignore
node_modules
.env
*.log

FROM node:18-alpine
COPY package*.json ./
RUN npm install
COPY src/ ./src/`,
    },
  },
  check: (ast: DockerfileAST): LintIssue[] => {
    const issues: LintIssue[] = []

    // 检测过宽复制模式
    const broadCopyPatterns = [
      /^\.\s+\.\s*$/,           // COPY . .
      /^\.\s+\S+\s*$/,          // COPY . /app
      /^\.\s*$/,                // COPY . (without dest - will error elsewhere)
    ]

    for (const inst of ast.instructions) {
      if (inst.type !== 'COPY' && inst.type !== 'ADD') continue

      const args = inst.args
        .replace(/--from=\S+\s*/gi, '')
        .replace(/--chown=\S+\s*/gi, '')
        .trim()

      // 检测过宽复制
      for (const pattern of broadCopyPatterns) {
        if (pattern.test(args)) {
          issues.push({
            id: 'X014',
            title: '可能需要 .dockerignore',
            message: '检测到过宽复制模式，可能复制了不需要的文件',
            suggestion: '考虑添加 .dockerignore 文件排除 .git、node_modules、.env 等目录',
            severity: 'info',
            confidence: 'low',
            line: inst.lineStart,
            instruction: inst.type,
            stageIndex: inst.stageIndex,
            category: 'best-practice',
          })
          break // 每行只报一次
        }
      }
    }

    return issues
  },
}

// 导出所有 context-check 规则
export const contextCheckRules: Rule[] = [
  ruleX014,
]