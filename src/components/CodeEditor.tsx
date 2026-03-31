import Editor, { OnMount, Monaco } from '@monaco-editor/react'
import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import type { editor } from 'monaco-editor'
import { useTheme } from '../contexts/ThemeContext'
import type { Diagnostic, Severity } from '../types'

export type { Diagnostic } from '../types'

export interface CodeEditorRef {
  goToLine: (line: number, lineEnd?: number, severity?: Severity) => void
  setMarkers: (diagnostics: Diagnostic[]) => void
}

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  diagnostics?: Diagnostic[]
}

// 存储高亮装饰
let highlightDecorations: string[] = []

// 严重级别对应的 CSS 类名
const severityHighlightClasses: Record<Severity, { line: string; glyph: string }> = {
  error: { line: 'highlighted-line-error', glyph: 'highlighted-line-error-glyph' },
  security: { line: 'highlighted-line-security', glyph: 'highlighted-line-security-glyph' },
  warning: { line: 'highlighted-line-warning', glyph: 'highlighted-line-warning-glyph' },
  info: { line: 'highlighted-line-info', glyph: 'highlighted-line-info-glyph' },
}

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(
  ({ value, onChange, diagnostics }, ref) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const monacoRef = useRef<Monaco | null>(null)
    const { theme } = useTheme()

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      goToLine: (line: number, lineEnd?: number, severity?: Severity) => {
        if (editorRef.current && monacoRef.current) {
          const editor = editorRef.current
          const monaco = monacoRef.current

          // 多行指令时，计算实际结束行
          const endLine = lineEnd && lineEnd > line ? lineEnd : line

          // 滚动到该行并设置光标位置
          editor.revealLineInCenter(line)
          editor.setPosition({ lineNumber: line, column: 1 })
          editor.focus()

          // 添加高亮效果
          const model = editor.getModel()
          if (model) {
            // 清除之前的高亮
            highlightDecorations = editor.deltaDecorations(highlightDecorations, [])

            // 根据严重级别选择高亮样式
            const style = severity ? severityHighlightClasses[severity] : severityHighlightClasses.warning

            // 添加新的高亮（支持多行）
            highlightDecorations = editor.deltaDecorations([], [
              {
                range: new monaco.Range(line, 1, endLine, model.getLineContent(endLine).length + 1),
                options: {
                  isWholeLine: true,
                  className: style.line,
                  glyphMarginClassName: style.glyph,
                },
              },
            ])

            // 2秒后移除高亮
            setTimeout(() => {
              if (editorRef.current) {
                highlightDecorations = editorRef.current.deltaDecorations(highlightDecorations, [])
              }
            }, 2000)
          }
        }
      },
      setMarkers: (diags: Diagnostic[]) => {
        if (monacoRef.current && editorRef.current) {
          const model = editorRef.current.getModel()
          if (model) {
            const markers = diags.map(d => ({
              severity: d.severity === 'error'
                ? monacoRef.current!.MarkerSeverity.Error
                : d.severity === 'warning' || d.severity === 'security'
                  ? monacoRef.current!.MarkerSeverity.Warning
                  : monacoRef.current!.MarkerSeverity.Info,
              message: d.message,
              startLineNumber: d.line,
              startColumn: d.column || 1,
              endLineNumber: d.line,
              endColumn: (model.getLineContent(d.line).length || 1) + 1,
            }))
            monacoRef.current.editor.setModelMarkers(model, 'dockerfile-linter', markers)
          }
        }
      },
    }))

    // 更新 markers
    useEffect(() => {
      if (diagnostics && editorRef.current && monacoRef.current) {
        const model = editorRef.current.getModel()
        if (model) {
          const markers = diagnostics.map(d => ({
            severity: d.severity === 'error'
              ? monacoRef.current!.MarkerSeverity.Error
              : d.severity === 'warning' || d.severity === 'security'
                ? monacoRef.current!.MarkerSeverity.Warning
                : monacoRef.current!.MarkerSeverity.Info,
            message: d.message,
            startLineNumber: d.line,
            startColumn: d.column || 1,
            endLineNumber: d.line,
            endColumn: (model.getLineContent(d.line).length || 1) + 1,
          }))
          monacoRef.current.editor.setModelMarkers(model, 'dockerfile-linter', markers)
        }
      }
    }, [diagnostics])

    const handleMount: OnMount = (editor, monaco) => {
      editorRef.current = editor
      monacoRef.current = monaco
    }

    return (
      <Editor
        height="100%"
        defaultLanguage="dockerfile"
        value={value}
        onChange={(v) => {
          onChange(v || '')
        }}
        onMount={handleMount}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          quickSuggestions: true,
          formatOnPaste: true,
        }}
      />
    )
  }
)