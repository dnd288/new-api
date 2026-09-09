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
import type { Table } from '@tanstack/react-table'
import { Send } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type { Redemption } from '../types'
import { useRedemptions } from './redemptions-provider'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const { t } = useTranslation()
  const { setOpen, setCurrentRow } = useRedemptions()
  const selectedRows = table.getSelectedRowModel().rows
  const singleSelected =
    selectedRows.length === 1 ? (selectedRows[0].original as Redemption) : null

  const contentToCopy = useMemo(() => {
    const selectedCodes = selectedRows.map((row) => {
      const redemption = row.original as Redemption
      return `${redemption.name}\t${redemption.key}`
    })
    return selectedCodes.join('\n')
  }, [selectedRows])

  return (
    <BulkActionsToolbar table={table} entityName={t('redemption code')}>
      <CopyButton
        value={contentToCopy}
        variant='outline'
        size='icon'
        className='size-8'
        tooltip={t('Copy selected codes')}
        successTooltip={t('Codes copied!')}
        aria-label={t('Copy selected codes')}
      />
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              disabled={!singleSelected}
              aria-label={t('Send code to order')}
              onClick={() => {
                if (!singleSelected) return
                setCurrentRow(singleSelected)
                setOpen('send')
              }}
            >
              <Send />
            </Button>
          }
        />
        <TooltipContent>
          {singleSelected
            ? t('Send code to order')
            : t('Select exactly one code to send')}
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}
