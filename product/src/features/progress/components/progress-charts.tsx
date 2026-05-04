'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { DailyScore } from '@/shared/types'
import { format, parseISO } from 'date-fns'

interface ProgressChartsProps {
  scores: DailyScore[]
}

export function ProgressCharts({ scores }: ProgressChartsProps) {
  const sorted = [...scores].sort((a, b) => a.date.localeCompare(b.date))

  const chartData = sorted.map(s => ({
    date: format(parseISO(s.date), 'MMM d'),
    points: s.total_points,
    isStreak: s.is_streak_day,
  }))

  // Distribution of ratings
  const distribution = [
    { label: '9 pts\n(Perfect)', value: sorted.filter(s => s.total_points === 9).length, color: '#22c55e' },
    { label: '7-8 pts', value: sorted.filter(s => s.total_points >= 7 && s.total_points < 9).length, color: '#86efac' },
    { label: '6 pts\n(Streak)', value: sorted.filter(s => s.total_points === 6).length, color: '#f59e0b' },
    { label: '4-5 pts', value: sorted.filter(s => s.total_points >= 4 && s.total_points < 6).length, color: '#fb923c' },
    { label: '1-3 pts', value: sorted.filter(s => s.total_points > 0 && s.total_points < 4).length, color: '#ef4444' },
  ]

  return (
    <div className="space-y-4">
      {/* Score trend */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">Score Trend</h3>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              interval={Math.floor(chartData.length / 5)}
            />
            <YAxis
              domain={[0, 9]}
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              ticks={[0, 3, 6, 9]}
            />
            <ReferenceLine y={6} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff15', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#9ca3af' }}
              itemStyle={{ color: '#22c55e' }}
            />
            <Area
              type="monotone"
              dataKey="points"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#scoreGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-muted-foreground text-center mt-1">Yellow line = 6pt streak threshold</p>
      </div>

      {/* Distribution */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-4">Day Distribution</h3>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={distribution} margin={{ top: 5, right: 5, bottom: 20, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#6b7280' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff15', borderRadius: 8, fontSize: 12 }}
              itemStyle={{ color: '#ffffff' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {distribution.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
