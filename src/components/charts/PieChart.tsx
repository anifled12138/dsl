interface PieChartProps {
  data: { label: string; value: number; color: string }[]
  size?: number
}

export function PieChart({ data, size = 200 }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-gray-400 dark:text-slate-500">无数据</span>
      </div>
    )
  }

  let currentAngle = -90 // 从顶部开始

  const segments = data.map(d => {
    const percentage = d.value / total
    const angle = percentage * 360
    const startAngle = currentAngle
    currentAngle += angle
    return {
      ...d,
      percentage,
      startAngle,
      endAngle: currentAngle,
    }
  })

  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(radius, radius, radius - 10, endAngle)
    const end = polarToCartesian(radius, radius, radius - 10, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

    return [
      `M ${radius} ${radius}`,
      `L ${start.x} ${start.y}`,
      `A ${radius - 10} ${radius - 10} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      'Z'
    ].join(' ')
  }

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angle: number) => {
    const rad = (angle * Math.PI) / 180
    return {
      x: centerX + radius * Math.cos(rad),
      y: centerY + radius * Math.sin(rad),
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((segment, index) => (
          <path
            key={index}
            d={createArcPath(segment.startAngle, segment.endAngle, size / 2)}
            fill={segment.color}
            className="transition-all duration-300 hover:opacity-80"
          />
        ))}
        {/* 中心圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 6}
          fill="white"
          className="dark:fill-slate-800"
        />
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-lg font-bold fill-gray-700 dark:fill-slate-200"
        >
          {total}
        </text>
      </svg>
      {/* 图例 */}
      <div className="flex flex-wrap gap-3 justify-center">
        {data.map((d, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-sm text-gray-600 dark:text-slate-300">
              {d.label}: {d.value} ({Math.round(d.value / total * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}