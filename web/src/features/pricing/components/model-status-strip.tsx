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
import { memo } from 'react'
import { useTranslation } from 'react-i18next'

import type { ModelStatusEntry } from '@/features/status/api'
import { cn } from '@/lib/utils'

export const ModelProbeStatus = memo(function ModelProbeStatus(props: {
  probe: ModelStatusEntry['probe'] | undefined
  className?: string
}) {
  const { t } = useTranslation()
  const probe = props.probe

  if (!probe?.checked) {
    return (
      <span
        className={cn(
          'text-muted-foreground/60 inline-flex items-center gap-1.5 text-xs',
          props.className
        )}
      >
        <span className='bg-muted-foreground/40 size-2 rounded-full' />
        {t('No data')}
      </span>
    )
  }

  if (probe.alive) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400',
          props.className
        )}
      >
        <span className='relative flex size-2'>
          <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60' />
          <span className='relative inline-flex size-2 rounded-full bg-emerald-500' />
        </span>
        {t('Operational')}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400',
        props.className
      )}
    >
      <span className='size-2 rounded-full bg-red-500' />
      {t('Down')}
    </span>
  )
})
