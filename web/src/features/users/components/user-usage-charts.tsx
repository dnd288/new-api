/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { VChart } from '@visactor/react-vchart'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { DateTimePicker } from '@/components/datetime-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { QuotaDataItem } from '@/features/dashboard/types'
import { useChartTheme } from '@/lib/use-chart-theme'

type Granularity = 'hour' | 'day' | 'week'
type Metric = 'quota' | 'token_used' | 'count'

interface UserUsageChartsProps {
  data: QuotaDataItem[]
  loading?: boolean
  startTime: Date
  endTime: Date
  granularity: Granularity
  onFilterChange: (filter: {
    startTime: Date
    endTime: Date
    granularity: Granularity
  }) => void
}

const metricOptions: Array<{ value: Metric; label: string }> = [
  { value: 'quota', label: 'Usage' },
  { value: 'token_used', label: 'Tokens' },
  { value: 'count', label: 'Requests' },
]

const granularityOptions: Array<{ value: Granularity; label: string }> = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
]

export function UserUsageCharts({
  data,
  loading,
  startTime,
  endTime,
  granularity,
  onFilterChange,
}: UserUsageChartsProps) {
  const { t } = useTranslation()
  const { resolvedTheme, themeReady } = useChartTheme()
  const [metric, setMetric] = useState<Metric>('quota')
  const [draftStart, setDraftStart] = useState(startTime)
  const [draftEnd, setDraftEnd] = useState(endTime)

  const modelData = useMemo(() => {
    const totals = new Map<string, number>()
    for (const item of data) {
      const model = item.model_name || t('Unknown model')
      totals.set(model, (totals.get(model) || 0) + (item[metric] || 0))
    }
    return Array.from(totals, ([model, value]) => ({ model, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [data, metric, t])

  const timeData = useMemo(() => {
    const totals = new Map<string, number>()
    for (const item of data) {
      const label = formatBucket(item.created_at, granularity)
      totals.set(label, (totals.get(label) || 0) + (item[metric] || 0))
    }
    return Array.from(totals, ([time, value]) => ({ time, value })).sort(
      (a, b) => a.time.localeCompare(b.time)
    )
  }, [data, granularity, metric])

  const modelSpec = useMemo(
    () => ({
      type: 'bar',
      data: [{ id: 'modelUsage', values: modelData }],
      xField: 'value',
      yField: 'model',
      direction: 'horizontal',
      padding: { left: 16, right: 24, top: 12, bottom: 24 },
      bar: { style: { cornerRadius: 4 } },
      axes: [
        { orient: 'left', type: 'band', label: { style: { fontSize: 12 } } },
        { orient: 'bottom', type: 'linear' },
      ],
      tooltip: { visible: true },
    }),
    [modelData]
  )

  const timeSpec = useMemo(
    () => ({
      type: 'bar',
      data: [{ id: 'peakUsage', values: timeData }],
      xField: 'time',
      yField: 'value',
      padding: { left: 48, right: 24, top: 12, bottom: 48 },
      bar: { style: { cornerRadius: 4 } },
      axes: [
        { orient: 'bottom', type: 'band', label: { autoRotate: true } },
        { orient: 'left', type: 'linear' },
      ],
      tooltip: { visible: true },
    }),
    [timeData]
  )

  const applyFilter = () => {
    onFilterChange({ startTime: draftStart, endTime: draftEnd, granularity })
  }

  let chartContent = (
    <div className='text-muted-foreground py-12 text-center text-sm'>
      {t('Loading...')}
    </div>
  )

  if (!loading && themeReady && data.length === 0) {
    chartContent = (
      <div className='text-muted-foreground py-12 text-center text-sm'>
        {t('No usage data')}
      </div>
    )
  }

  if (!loading && themeReady && data.length > 0) {
    chartContent = (
      <div className='grid gap-6 xl:grid-cols-2'>
        <ChartPanel
          title={t('Model Usage')}
          spec={modelSpec}
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        />
        <ChartPanel
          title={t('Peak Usage Time')}
          spec={timeSpec}
          theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
        />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className='space-y-4'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
          <CardTitle>{t('Usage Analytics')}</CardTitle>
          <div className='flex flex-wrap gap-2'>
            {metricOptions.map((option) => (
              <Button
                key={option.value}
                type='button'
                variant={metric === option.value ? 'default' : 'outline'}
                size='sm'
                onClick={() => setMetric(option.value)}
              >
                {t(option.label)}
              </Button>
            ))}
          </div>
        </div>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-end'>
          <div className='grid gap-3 sm:grid-cols-2 lg:flex-1'>
            <DateTimePicker
              value={draftStart}
              onChange={(date) => date && setDraftStart(date)}
            />
            <DateTimePicker
              value={draftEnd}
              onChange={(date) => date && setDraftEnd(date)}
            />
          </div>
          <div className='flex flex-wrap gap-2'>
            {granularityOptions.map((option) => (
              <Button
                key={option.value}
                type='button'
                variant={granularity === option.value ? 'default' : 'outline'}
                size='sm'
                onClick={() =>
                  onFilterChange({
                    startTime,
                    endTime,
                    granularity: option.value,
                  })
                }
              >
                {t(option.label)}
              </Button>
            ))}
            <Button type='button' size='sm' onClick={applyFilter}>
              {t('Search')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>{chartContent}</CardContent>
    </Card>
  )
}

function ChartPanel({
  title,
  spec,
  theme,
}: {
  title: string
  spec: Record<string, unknown>
  theme: string
}) {
  return (
    <div className='space-y-3 rounded-lg border p-4'>
      <h3 className='text-sm font-medium'>{title}</h3>
      <div className='h-[320px]'>
        <VChart spec={{ ...spec, theme }} />
      </div>
    </div>
  )
}

function formatBucket(timestamp: number, granularity: Granularity) {
  const date = dayjs.unix(timestamp)
  if (granularity === 'week') return date.startOf('week').format('YYYY-MM-DD')
  if (granularity === 'day') return date.format('YYYY-MM-DD')
  return date.format('YYYY-MM-DD HH:00')
}
