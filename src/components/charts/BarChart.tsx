interface BarChartProps {
  data: { label: string; value: number; color: string }[]
  height?: number
  showValues?: boolean
}

export function BarChart({ data, height = 200, showValues = true }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="w-full">
      <div
        className="flex items-end gap-2 justify-center"
        style={{ height }}
      >
        {data.map((d, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-1 flex-1 max-w-20"
          >
            {showValues && (
              <span className="text-sm font-medium text-gray-600 dark:text-slate-300">
                {d.value}
              </span>
            )}
            <div
              className="w-full rounded-t-lg transition-all duration-300 hover:opacity-80"
              style={{
                height: `${(d.value / maxValue) * (height - 30)}px`,
                backgroundColor: d.color,
                minHeight: d.value > 0 ? '4px' : '0px',
              }}
            />
          </div>
        ))}
      </div>
      {/* 标签 */}
      <div className="flex gap-2 mt-2 justify-center">
        {data.map((d, index) => (
          <div
            key={index}
            className="flex-1 max-w-20 text-center text-xs text-gray-500 dark:text-slate-400 truncate"
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}