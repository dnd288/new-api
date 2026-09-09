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
import { ExternalLink, Ticket } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { buttonVariants } from '@/components/ui/button'
import { IconBadge } from '@/components/ui/icon-badge'
import { Label } from '@/components/ui/label'

const COBAR_VOUCHER_URL =
  'https://cobar.vn/products/voucher-mezon-llm-10k-mzd'

export function VoucherSection() {
  const { t } = useTranslation()

  return (
    <div className='space-y-2.5 border-t pt-4 sm:space-y-3 sm:pt-6'>
      <div className='flex items-center gap-2'>
        <IconBadge tone='info' size='xs'>
          <Ticket />
        </IconBadge>
        <Label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
          {t('Mezon Đồng Voucher')}
        </Label>
      </div>

      <p className='text-muted-foreground text-xs sm:text-sm'>
        {t(
          'Buy a voucher in any denomination (10.000 – 500.000 đồng) at cobar.vn, then redeem the code below to top up your balance.'
        )}
      </p>

      <a
        href={COBAR_VOUCHER_URL}
        target='_blank'
        rel='noopener noreferrer'
        className={buttonVariants({ variant: 'outline', size: 'sm' }) + ' gap-1.5'}
      >
        {t('Buy Voucher')}
        <ExternalLink className='h-3.5 w-3.5' />
      </a>
    </div>
  )
}
