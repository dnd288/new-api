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
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { getUserQuotaDates } from '@/features/dashboard/api'

import { getUser } from '../api'
import { UserProfileHeader } from './user-profile-header'
import { UserUsageCharts } from './user-usage-charts'

type Granularity = 'hour' | 'day' | 'week'

export function UserProfilePage() {
  const { t } = useTranslation()
  const params = useParams({ from: '/_authenticated/users/$id' })
  const userId = Number(params.id)
  const [filter, setFilter] = useState(() => ({
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endTime: new Date(),
    granularity: 'day' as Granularity,
  }))

  const userQuery = useQuery({
    queryKey: ['admin-user-profile', userId],
    queryFn: async () => {
      const response = await getUser(userId)
      if (!response.success || !response.data) {
        throw new Error(response.message || t('Failed to load user'))
      }
      return response.data
    },
    enabled: Number.isFinite(userId),
  })

  const usageQuery = useQuery({
    queryKey: [
      'admin-user-profile-usage',
      userQuery.data?.username,
      filter.startTime.getTime(),
      filter.endTime.getTime(),
    ],
    queryFn: async () => {
      const response = await getUserQuotaDates(
        {
          username: userQuery.data?.username,
          start_timestamp: Math.floor(filter.startTime.getTime() / 1000),
          end_timestamp: Math.floor(filter.endTime.getTime() / 1000),
        },
        true
      )
      if (!response.success) {
        throw new Error(t('Failed to load usage data'))
      }
      return response.data ?? []
    },
    enabled: Boolean(userQuery.data?.username),
    staleTime: 60_000,
  })

  if (userQuery.isLoading) {
    return (
      <div className='text-muted-foreground p-6 text-sm'>{t('Loading...')}</div>
    )
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <div className='space-y-4 p-6'>
        <Button variant='outline' size='sm' render={<Link to='/users' />}>
          <ArrowLeft className='mr-2 size-4' />
          {t('Back to Users')}
        </Button>
        <div className='text-destructive text-sm'>
          {userQuery.error?.message || t('Failed to load user')}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6 p-4 md:p-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            {t('View User Profile')}
          </h1>
          <p className='text-muted-foreground text-sm'>
            {t('User Details')}: {userQuery.data.username}
          </p>
        </div>
        <Button variant='outline' size='sm' render={<Link to='/users' />}>
          <ArrowLeft className='mr-2 size-4' />
          {t('Back to Users')}
        </Button>
      </div>

      <UserProfileHeader user={userQuery.data} />
      <UserUsageCharts
        data={usageQuery.data ?? []}
        loading={usageQuery.isLoading}
        startTime={filter.startTime}
        endTime={filter.endTime}
        granularity={filter.granularity}
        onFilterChange={setFilter}
      />
    </div>
  )
}
