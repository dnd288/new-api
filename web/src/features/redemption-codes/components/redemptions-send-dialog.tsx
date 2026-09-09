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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { sendRedemption } from '../api'
import { SUCCESS_MESSAGES } from '../constants'
import { useRedemptions } from './redemptions-provider'

export function RedemptionsSendDialog() {
  const { t } = useTranslation()
  const { open, setOpen, currentRow, triggerRefresh } = useRedemptions()
  const [orderId, setOrderId] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    if (!currentRow) return
    const trimmedOrderId = orderId.trim()
    if (!trimmedOrderId) return

    setIsSending(true)
    try {
      const result = await sendRedemption(currentRow.id, trimmedOrderId)
      if (result.success) {
        toast.success(
          t(SUCCESS_MESSAGES.REDEMPTION_SENT, { orderId: trimmedOrderId })
        )
        setOpen(null)
        setOrderId('')
        triggerRefresh()
      }
    } finally {
      setIsSending(false)
    }
  }

  return (
    <AlertDialog
      open={open === 'send'}
      onOpenChange={(isOpen) => !isOpen && setOpen(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('Send Code to Order')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('This will mark redemption code')}{' '}
            <span className='font-semibold'>{currentRow?.name}</span>{' '}
            {t('as used for the given order. This action cannot be undone.')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className='space-y-1.5'>
          <Label htmlFor='redemption-send-order-id'>{t('Order ID')}</Label>
          <Input
            id='redemption-send-order-id'
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder={t('Enter order ID')}
            disabled={isSending}
            maxLength={128}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSending}>
            {t('Cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSend}
            disabled={isSending || !orderId.trim()}
          >
            {isSending ? t('Sending...') : t('Send')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
