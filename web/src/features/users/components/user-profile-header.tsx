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
import { Copy, Mail, Shield, User as UserIcon, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatQuota } from '@/lib/format'

import { USER_ROLES } from '../constants'
import type { User } from '../types'

interface UserProfileHeaderProps {
  user: User
}

export function UserProfileHeader({ user }: UserProfileHeaderProps) {
  const { t } = useTranslation()
  const displayName = user.display_name || user.username
  const role = USER_ROLES[user.role as keyof typeof USER_ROLES]
  const initials = displayName.slice(0, 2).toUpperCase()

  const copyUserId = async () => {
    await navigator.clipboard.writeText(String(user.id))
  }

  return (
    <Card className='from-primary/10 via-background to-background overflow-hidden border-0 bg-gradient-to-br shadow-sm'>
      <CardContent className='p-6'>
        <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex min-w-0 items-start gap-4'>
            <Avatar className='border-background size-20 border-4 shadow-md'>
              <AvatarFallback className='bg-primary/15 text-primary text-xl font-semibold'>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className='min-w-0 space-y-2'>
              <div className='flex flex-wrap items-center gap-2'>
                <h1 className='truncate text-2xl font-bold tracking-tight'>
                  {displayName}
                </h1>
                {role && <Badge variant='secondary'>{t(role.labelKey)}</Badge>}
                <button
                  type='button'
                  onClick={copyUserId}
                  className='bg-background/80 text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors'
                >
                  <span>ID {user.id}</span>
                  <Copy className='size-3' />
                </button>
              </div>
              <div className='text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 text-sm'>
                <span className='inline-flex items-center gap-1.5'>
                  <UserIcon className='size-4' />@{user.username}
                </span>
                {user.email && (
                  <span className='inline-flex items-center gap-1.5'>
                    <Mail className='size-4' />
                    {user.email}
                  </span>
                )}
                {user.group && (
                  <span className='inline-flex items-center gap-1.5'>
                    <Users className='size-4' />
                    {user.group}
                  </span>
                )}
                <span className='inline-flex items-center gap-1.5'>
                  <Shield className='size-4' />
                  {t('Status')}: {user.status}
                </span>
              </div>
            </div>
          </div>
          <div className='grid gap-3 sm:grid-cols-3 lg:min-w-[480px]'>
            <StatCard
              label={t('Current Balance')}
              value={formatQuota(user.quota)}
            />
            <StatCard
              label={t('Total Usage')}
              value={formatQuota(user.used_quota)}
            />
            <StatCard
              label={t('API Requests')}
              value={user.request_count.toLocaleString()}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className='bg-background/80 shadow-none'>
      <CardHeader className='p-4 pb-2'>
        <CardTitle className='text-muted-foreground text-xs font-medium'>
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className='p-4 pt-0'>
        <div className='text-xl font-semibold'>{value}</div>
      </CardContent>
    </Card>
  )
}
