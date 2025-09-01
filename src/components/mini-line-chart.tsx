"use client"

import { useMemo } from "react"
import { LineChart, Line, ResponsiveContainer } from "recharts"

type Props = {
  data: number[]
  color?: string
  className?: string
}

export default function MiniLineChart({ data, color = "#3b82f6", className }: Props) {
  const chartData = useMemo(() => {
    return data.map((value, index) => ({
      index,
      value,
    }))
  }, [data])

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, stroke: color, strokeWidth: 2, fill: "#fff" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
