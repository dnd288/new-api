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
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, RefreshCw, DollarSign } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { Dialog } from '@/components/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { IconBadge } from '@/components/ui/icon-badge'
import { formatCurrencyFromUSD } from '@/lib/currency'
import { formatTimestampToDate } from '@/lib/format'

import { CHANNEL_TYPE_TOP1DATA } from '../../constants'
import type { KeyBalanceEntry } from '../../types'

import { getCodexUsage, updateChannelBalance } from '../../api'
import { channelsQueryKeys } from '../../lib'
import { useChannels } from '../channels-provider'
import {
  CodexUsageDialog,
  type CodexUsageDialogData,
} from './codex-usage-dialog'

type BalanceQueryDialogProps = {
  initialRawResponse?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BalanceQueryDialog(props: BalanceQueryDialogProps) {
  const { t } = useTranslation()
  const { currentRow, setCurrentRow } = useChannels()
  const queryClient = useQueryClient()
  const [isQuerying, setIsQuerying] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [balanceUpdatedTime, setBalanceUpdatedTime] = useState<number | null>(
    null
  )
  const [rawResponse, setRawResponse] = useState<string | null>(
    props.initialRawResponse ?? null
  )
  const [details, setDetails] = useState<Record<string, unknown> | null>(null)
  const [keyBalances, setKeyBalances] = useState<KeyBalanceEntry[] | null>(null)
  const [codexUsageResponse, setCodexUsageResponse] =
    useState<CodexUsageDialogData | null>(null)

  const isCodex = currentRow?.type === 57

  const isTop1Data =
    currentRow?.type === CHANNEL_TYPE_TOP1DATA ||
    (currentRow?.base_url ?? '')
      .toLowerCase()
      .match(/top1data|techopenclaw/) !== null

  const handleQueryCodexUsage = async () => {
    const row = currentRow
    if (!row) return
    setIsQuerying(true)
    try {
      const res = await getCodexUsage(row.id)
      if (!res.success) {
        throw new Error(res.message || t('Failed to fetch usage'))
      }
      setCodexUsageResponse(res)
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : t('Failed to fetch usage')
      )
    } finally {
      setIsQuerying(false)
    }
  }

  useEffect(() => {
    if (!isCodex) return
    if (!props.open) return
    handleQueryCodexUsage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.open, isCodex])

  if (!currentRow) return null

  const handleQueryBalance = async () => {
    setIsQuerying(true)
    try {
      const response = await updateChannelBalance(currentRow.id)
      if (response.success && response.balance !== undefined) {
        const newBalance = response.balance
        const now = Math.floor(Date.now() / 1000)

        setBalance(newBalance)
        setBalanceUpdatedTime(now)
        toast.success(t('Balance updated successfully'))

        // Update currentRow immediately with new balance and timestamp
        setCurrentRow({
          ...currentRow,
          balance: newBalance,
          balance_updated_time: now,
        })

        // Invalidate queries to refresh the table
        await queryClient.invalidateQueries({
          queryKey: channelsQueryKeys.lists(),
        })
        setRawResponse(null)
        setDetails(response.details ?? null)
        setKeyBalances(response.key_balances ?? null)
      } else if (response.success && response.raw_response !== undefined) {
        setRawResponse(response.raw_response)
        setDetails(null)
        setKeyBalances(null)
      } else {
        toast.error(response.message || t('Failed to query balance'))
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : t('Failed to query balance')
      )
    } finally {
      setIsQuerying(false)
    }
  }

  const handleClose = () => {
    setBalance(null)
    setBalanceUpdatedTime(null)
    setRawResponse(null)
    setDetails(null)
    setKeyBalances(null)
    setCodexUsageResponse(null)
    props.onOpenChange(false)
  }

  const formatBalance = (bal: number) =>
    formatCurrencyFromUSD(bal, {
      digitsLarge: 2,
      digitsSmall: 4,
      abbreviate: false,
    })

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Never'
    return formatTimestampToDate(timestamp)
  }

  const formatDetailValue = (value: unknown): string => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(
        value
      )
    }
    if (typeof value === 'string') return value
    return '-'
  }

  const formatCredits = (value: unknown): string => {
    if (typeof value !== 'number') return '-'
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value) + ' credits'
  }

  const formatHours = (seconds: unknown): string => {
    if (typeof seconds !== 'number' || seconds <= 0) return '-'
    const hours = seconds / 3600
    if (hours < 1) {
      const mins = Math.round(seconds / 60)
      return `${mins} ${mins === 1 ? 'min' : 'mins'}`
    }
    return `${hours.toFixed(1)} ${hours === 1 ? 'hr' : 'hrs'}`
  }

  const renderDailyUsageBar = (
    used: number,
    limit: number,
    label: string
  ) => {
    const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
    const color = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e'
    return (
      <div className='space-y-1'>
        <div className='flex items-center justify-between text-xs'>
          <span className='text-muted-foreground'>{label}</span>
          <span className='font-medium'>
            {formatDetailValue(used)} / {formatDetailValue(limit)}
          </span>
        </div>
        <div className='h-2.5 w-full overflow-hidden rounded-full bg-muted'>
          <div
            className='h-full rounded-full transition-all'
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <div className='text-muted-foreground text-right text-[10px]'>
          {pct.toFixed(1)}%
        </div>
      </div>
    )
  }

  const renderDailySpendingChart = (
    spending: Record<string, unknown>[]
  ) => {
    if (spending.length === 0) return null
    const maxSpending = Math.max(
      ...spending.map((d) =>
        typeof d.spending === 'number' ? d.spending : 0
      ),
      0.001
    )
    return (
      <div className='space-y-2'>
        <div className='text-sm font-medium'>{t('Daily Spending')}</div>
        <div className='max-h-64 space-y-1 overflow-auto'>
          {spending.map((item, i) => {
            const val =
              typeof item.spending === 'number' ? item.spending : 0
            const pct = (val / maxSpending) * 100
            const req =
              typeof item.requests === 'number' ? item.requests : 0
            return (
              <div key={`${String(item.date)}-${i}`} className='space-y-0.5'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-muted-foreground w-20 shrink-0'>
                    {String(item.date ?? '')}
                  </span>
                  <span className='flex-1 px-2'>
                    <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
                      <div
                        className='h-full rounded-full bg-blue-500 transition-all'
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </span>
                  <span className='w-28 shrink-0 text-right text-[11px] font-medium tabular-nums'>
                    {formatDetailValue(val)} · {formatDetailValue(req)} req
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDetailRows = () => {
    if (!details) return null

    const plan = details.plan as Record<string, unknown> | undefined
    const stats = details.stats as Record<string, unknown> | undefined
    const dailySpending = Array.isArray(details.daily_spending)
      ? (details.daily_spending as Record<string, unknown>[])
      : []

    const planDailyLimit =
      typeof plan?.daily_limit === 'number' ? (plan.daily_limit as number) : 0
    const planDailyRemaining =
      typeof plan?.daily_remaining === 'number'
        ? (plan.daily_remaining as number)
        : 0
    const dailyUsed =
      typeof plan?.daily_used === 'number'
        ? (plan.daily_used as number)
        : planDailyLimit > 0
          ? planDailyLimit - planDailyRemaining
          : 0
    const dailyLimit = planDailyLimit > 0 ? planDailyLimit
      : typeof details.daily_limit === 'number' ? details.daily_limit : 0

    const formatExpiry = (expiresAt: unknown, expiresInDays: unknown): string => {
      if (typeof expiresInDays === 'number' && expiresInDays > 0) {
        const dateStr = typeof expiresAt === 'string' ? expiresAt : ''
        const daysLabel = expiresInDays === 1 ? t('day') : t('days')
        const parts = [`${expiresInDays} ${daysLabel}`]
        if (dateStr) parts.push(`(${dateStr})`)
        return parts.join(' ')
      }
      if (typeof expiresAt === 'string' && expiresAt) return expiresAt
      return '-'
    }

    return (
      <div className='space-y-4'>
        {/* Credit breakdown */}
        <div className='grid gap-2 sm:grid-cols-2'>
          <div className='rounded-lg border p-3 text-center'>
            <div className='text-muted-foreground text-xs'>
              {t('Plan Credit')}
            </div>
            <div className='mt-1 text-lg font-bold'>
              {formatCredits(
                typeof details.balance === 'number'
                  ? details.balance
                  : 0
              )}
            </div>
          </div>
          <div className='rounded-lg border p-3 text-center'>
            <div className='text-muted-foreground text-xs'>
              {t('Top-up Balance')}
            </div>
            <div className='mt-1 text-lg font-bold'>
              {formatCredits(details.topup_balance)}
            </div>
          </div>
        </div>

        {/* Daily usage bar */}
        {dailyLimit > 0 && (
          <div className='space-y-3 rounded-lg border p-4'>
            <div className='text-sm font-medium'>{t('Daily Usage')}</div>
            {renderDailyUsageBar(dailyUsed, dailyLimit, t('Today'))}
          </div>
        )}

        {/* Plan info */}
        <div className='grid gap-2 sm:grid-cols-2'>
          {plan?.name && (
            <div className='rounded-md bg-muted/40 p-3'>
              <div className='text-muted-foreground text-xs'>{t('Plan')}</div>
              <div className='mt-1 text-sm font-medium'>
                {String(plan.name)}
              </div>
            </div>
          )}
          {(plan?.expires_at || typeof plan?.expires_in_days === 'number') && (
            <div className='rounded-md bg-muted/40 p-3'>
              <div className='text-muted-foreground text-xs'>
                {t('Expires')}
              </div>
              <div className='mt-1 text-sm font-medium'>
                {formatExpiry(plan?.expires_at, plan?.expires_in_days)}
              </div>
            </div>
          )}
          {typeof plan?.reset_in_seconds === 'number' && (
            <div className='rounded-md bg-muted/40 p-3'>
              <div className='text-muted-foreground text-xs'>
                {t('Resets In')}
              </div>
              <div className='mt-1 text-sm font-medium'>
                {formatHours(plan.reset_in_seconds)}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className='space-y-2 rounded-lg border p-4'>
            <div className='text-sm font-medium'>{t('Statistics')}</div>
            <div className='grid gap-2 sm:grid-cols-3'>
              {typeof stats.total_requests === 'number' && (
                <div className='rounded-md bg-muted/40 p-2'>
                  <div className='text-muted-foreground text-[10px]'>
                    {t('Total Requests')}
                  </div>
                  <div className='text-sm font-medium'>
                    {formatDetailValue(stats.total_requests)}
                  </div>
                </div>
              )}
              {typeof stats.total_spending === 'number' && (
                <div className='rounded-md bg-muted/40 p-2'>
                  <div className='text-muted-foreground text-[10px]'>
                    {t('Total Spending')}
                  </div>
                  <div className='text-sm font-medium'>
                    {formatCredits(stats.total_spending)}
                  </div>
                </div>
              )}
              {typeof stats.avg_per_day === 'number' && (
                <div className='rounded-md bg-muted/40 p-2'>
                  <div className='text-muted-foreground text-[10px]'>
                    {t('Average Per Day')}
                  </div>
                  <div className='text-sm font-medium'>
                    {formatCredits(stats.avg_per_day)}
                  </div>
                </div>
              )}
              {typeof stats.input_tokens === 'number' && (
                <div className='rounded-md bg-muted/40 p-2'>
                  <div className='text-muted-foreground text-[10px]'>
                    {t('Input Tokens')}
                  </div>
                  <div className='text-sm font-medium'>
                    {formatDetailValue(stats.input_tokens)}
                  </div>
                </div>
              )}
              {typeof stats.output_tokens === 'number' && (
                <div className='rounded-md bg-muted/40 p-2'>
                  <div className='text-muted-foreground text-[10px]'>
                    {t('Output Tokens')}
                  </div>
                  <div className='text-sm font-medium'>
                    {formatDetailValue(stats.output_tokens)}
                  </div>
                </div>
              )}
              {typeof stats.cached_tokens === 'number' && (
                <div className='rounded-md bg-muted/40 p-2'>
                  <div className='text-muted-foreground text-[10px]'>
                    {t('Cached Tokens')}
                  </div>
                  <div className='text-sm font-medium'>
                    {formatDetailValue(stats.cached_tokens)}
                  </div>
                </div>
              )}
              {stats.peak_hour && (
                <div className='rounded-md bg-muted/40 p-2'>
                  <div className='text-muted-foreground text-[10px]'>
                    {t('Peak Hour')}
                  </div>
                  <div className='text-sm font-medium'>
                    {String(stats.peak_hour)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Daily spending chart */}
        {renderDailySpendingChart(dailySpending)}
      </div>
    )
  }

  const renderMultiKeyBalances = () => {
    if (!keyBalances || keyBalances.length === 0) return null

    return (
      <div className='space-y-3'>
        <div className='text-sm font-medium'>
          {t('Per-Key Balance')} ({keyBalances.length} keys)
        </div>
        {keyBalances.map((entry) => {
          const entryDetails = entry.details as
            | Record<string, unknown>
            | undefined
          const plan = entryDetails?.plan as
            | Record<string, unknown>
            | undefined
          const stats = entryDetails?.stats as
            | Record<string, unknown>
            | undefined
          const dailySpending = Array.isArray(entryDetails?.daily_spending)
            ? (entryDetails.daily_spending as Record<string, unknown>[])
            : []
          const planDailyLimit =
            typeof plan?.daily_limit === 'number'
              ? (plan.daily_limit as number)
              : 0
          const planDailyRemaining =
            typeof plan?.daily_remaining === 'number'
              ? (plan.daily_remaining as number)
              : 0
          const dailyUsed =
            typeof plan?.daily_used === 'number'
              ? (plan.daily_used as number)
              : planDailyLimit > 0
                ? planDailyLimit - planDailyRemaining
                : 0
          const dailyLimit = planDailyLimit > 0
            ? planDailyLimit
            : typeof entryDetails?.daily_limit === 'number'
              ? entryDetails.daily_limit
              : 0

          return (
            <div
              key={entry.key_index}
              className='space-y-2 rounded-lg border p-3'
            >
              <div className='flex items-center justify-between'>
                <code className='text-muted-foreground text-xs'>
                  Key {entry.key_index + 1}: {entry.key_hint}
                </code>
                {entry.error ? (
                  <span className='text-xs text-red-500'>{entry.error}</span>
                ) : (
                  <span className='text-sm font-bold'>
                    {formatCredits(entry.balance)}
                  </span>
                )}
              </div>
              {!entry.error && entryDetails && (
                <div className='space-y-2'>
                  {/* Credit breakdown */}
                  <div className='grid gap-1.5 sm:grid-cols-2'>
                    <div className='rounded bg-muted/40 px-2 py-1.5'>
                      <div className='text-muted-foreground text-[10px]'>
                        {t('Plan Credit')}
                      </div>
                      <div className='text-xs font-medium'>
                        {formatCredits(entryDetails.balance)}
                      </div>
                    </div>
                    <div className='rounded bg-muted/40 px-2 py-1.5'>
                      <div className='text-muted-foreground text-[10px]'>
                        {t('Top-up Balance')}
                      </div>
                      <div className='text-xs font-medium'>
                        {formatCredits(entryDetails.topup_balance)}
                      </div>
                    </div>
                  </div>
                  {/* Daily usage */}
                  {dailyLimit > 0 &&
                    renderDailyUsageBar(dailyUsed, dailyLimit, t('Today'))}
                  {/* Plan info */}
                  {plan?.name && (
                    <div className='text-muted-foreground text-[10px]'>
                      {String(plan.name)}
                      {plan?.expires_in_days
                        ? ` · ${plan.expires_in_days} ${t('days')}`
                        : ''}
                      {typeof plan?.reset_in_seconds === 'number'
                        ? ` · ${t('Resets In')} ${formatHours(plan.reset_in_seconds)}`
                        : ''}
                    </div>
                  )}
                  {/* Statistics */}
                  {stats && (
                    <div className='space-y-1.5 rounded border p-2'>
                      <div className='text-xs font-medium'>{t('Statistics')}</div>
                      <div className='grid gap-1.5 sm:grid-cols-3'>
                        {typeof stats.total_requests === 'number' && (
                          <div className='rounded bg-muted/40 px-2 py-1'>
                            <div className='text-muted-foreground text-[10px]'>
                              {t('Total Requests')}
                            </div>
                            <div className='text-xs font-medium'>
                              {formatDetailValue(stats.total_requests)}
                            </div>
                          </div>
                        )}
                        {typeof stats.total_spending === 'number' && (
                          <div className='rounded bg-muted/40 px-2 py-1'>
                            <div className='text-muted-foreground text-[10px]'>
                              {t('Total Spending')}
                            </div>
                            <div className='text-xs font-medium'>
                              {formatCredits(stats.total_spending)}
                            </div>
                          </div>
                        )}
                        {typeof stats.avg_per_day === 'number' && (
                          <div className='rounded bg-muted/40 px-2 py-1'>
                            <div className='text-muted-foreground text-[10px]'>
                              {t('Average Per Day')}
                            </div>
                            <div className='text-xs font-medium'>
                              {formatCredits(stats.avg_per_day)}
                            </div>
                          </div>
                        )}
                        {typeof stats.input_tokens === 'number' && (
                          <div className='rounded bg-muted/40 px-2 py-1'>
                            <div className='text-muted-foreground text-[10px]'>
                              {t('Input Tokens')}
                            </div>
                            <div className='text-xs font-medium'>
                              {formatDetailValue(stats.input_tokens)}
                            </div>
                          </div>
                        )}
                        {typeof stats.output_tokens === 'number' && (
                          <div className='rounded bg-muted/40 px-2 py-1'>
                            <div className='text-muted-foreground text-[10px]'>
                              {t('Output Tokens')}
                            </div>
                            <div className='text-xs font-medium'>
                              {formatDetailValue(stats.output_tokens)}
                            </div>
                          </div>
                        )}
                        {typeof stats.cached_tokens === 'number' && (
                          <div className='rounded bg-muted/40 px-2 py-1'>
                            <div className='text-muted-foreground text-[10px]'>
                              {t('Cached Tokens')}
                            </div>
                            <div className='text-xs font-medium'>
                              {formatDetailValue(stats.cached_tokens)}
                            </div>
                          </div>
                        )}
                        {stats.peak_hour && (
                          <div className='rounded bg-muted/40 px-2 py-1'>
                            <div className='text-muted-foreground text-[10px]'>
                              {t('Peak Hour')}
                            </div>
                            <div className='text-xs font-medium'>
                              {String(stats.peak_hour)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Daily spending chart */}
                  {dailySpending.length > 0 && renderDailySpendingChart(dailySpending)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (isCodex) {
    return (
      <CodexUsageDialog
        open={props.open}
        onOpenChange={(v) => {
          if (!v) handleClose()
        }}
        channelName={currentRow.name}
        channelId={currentRow.id}
        response={codexUsageResponse}
        onRefresh={handleQueryCodexUsage}
        isRefreshing={isQuerying}
      />
    )
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={handleClose}
      title={t('Query Balance')}
      description={
        <>
          {t('Update balance for:')}
          <strong>{currentRow.name}</strong>
        </>
      }
      contentHeight='auto'
      bodyClassName='space-y-4'
      footer={
        <Button variant='outline' onClick={handleClose} disabled={isQuerying}>
          {t('Close')}
        </Button>
      }
    >
      <div className='space-y-4 py-4'>
        {rawResponse !== null ? (
          <>
            <Alert>
              <AlertTitle>{t('Balance response not recognized')}</AlertTitle>
              <AlertDescription>
                {t(
                  'The upstream response is valid JSON, but it does not match the OpenAI credit_summary format. The channel balance was not updated.'
                )}
              </AlertDescription>
            </Alert>
            <CodeBlock
              code={rawResponse}
              language='json'
              maxExpandedLines={24}
              showLineNumbers
              title={t('Upstream JSON response')}
            >
              <CodeBlockCopyButton />
            </CodeBlock>
          </>
        ) : (
          <>
            {/* Current Balance Display */}
            <div className='bg-muted/50 rounded-lg border p-4'>
              <div className='text-muted-foreground mb-2 flex items-center gap-2 text-sm'>
                <IconBadge tone='success' size='xs'>
                  <DollarSign />
                </IconBadge>
                <span>{t('Current Balance')}</span>
              </div>
              <div className='text-2xl font-bold'>
                {isTop1Data
                  ? formatCredits(balance ?? currentRow.balance)
                  : balance !== null
                    ? formatBalance(balance)
                    : formatBalance(currentRow.balance)}
              </div>
              <div className='text-muted-foreground mt-2 text-xs'>
                {t('Last updated:')}{' '}
                {formatDate(
                  balanceUpdatedTime ?? currentRow.balance_updated_time
                )}
              </div>
            </div>
            {keyBalances && keyBalances.length > 1
              ? renderMultiKeyBalances()
              : renderDetailRows()}
          </>
        )}

        {/* Balance Update Button */}
        <Button
          className='w-full'
          onClick={handleQueryBalance}
          disabled={isQuerying}
        >
          {isQuerying && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          {!isQuerying && <RefreshCw className='mr-2 h-4 w-4' />}
          {isQuerying ? t('Querying...') : t('Update Balance')}
        </Button>
      </div>
    </Dialog>
  )
}
