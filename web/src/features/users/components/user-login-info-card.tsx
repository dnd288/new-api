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
import { Monitor, Smartphone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTimestamp } from '@/lib/format'

import type { LoginSession } from '../types'

interface UserLoginInfoCardProps {
  sessions: LoginSession[]
  loading?: boolean
}

export function UserLoginInfoCard({
  sessions,
  loading,
}: UserLoginInfoCardProps) {
  const { t } = useTranslation()
  let content = (
    <div className='text-muted-foreground text-sm'>{t('Loading...')}</div>
  )

  if (!loading && sessions.length === 0) {
    content = (
      <div className='text-muted-foreground text-sm'>
        {t('No active login sessions')}
      </div>
    )
  }

  if (!loading && sessions.length > 0) {
    content = (
      <div className='space-y-3'>
        {sessions.map((session) => {
          const isMobile = /mobile|android|iphone|ipad/i.test(
            session.user_agent || ''
          )
          const Icon = isMobile ? Smartphone : Monitor
          return (
            <div
              key={session.sid}
              className='bg-card flex gap-3 rounded-lg border p-3'
            >
              <div className='bg-muted text-muted-foreground mt-0.5 rounded-md p-2'>
                <Icon className='size-4' />
              </div>
              <div className='min-w-0 flex-1 space-y-1'>
                <div className='truncate text-sm font-medium'>
                  {session.user_agent || t('Unknown device')}
                </div>
                <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs'>
                  {session.ip && <span>{session.ip}</span>}
                  <span>
                    {t('Last active')}:{' '}
                    {formatTimestamp(session.last_active_at)}
                  </span>
                  <span>
                    {t('Expires at')}: {formatTimestamp(session.expires_at)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Login Info')}</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  )
}
