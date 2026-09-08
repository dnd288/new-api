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
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { formatVoucherAmount, VOUCHER_DENOMINATIONS } from '../lib/vouchers'

describe('voucher catalog', () => {
  it('has the six fixed denominations in ascending order', () => {
    expect(VOUCHER_DENOMINATIONS.map((voucher) => voucher.amount)).toEqual([
      10_000, 20_000, 50_000, 100_000, 200_000, 500_000,
    ])
  })

  it('maps every denomination to an existing bundled voucher image', () => {
    const publicDir = resolve(__dirname, '../../../../public')
    for (const voucher of VOUCHER_DENOMINATIONS) {
      expect(voucher.image).toMatch(/^\/vouchers\/voucher-[\w]+\.svg$/)
      expect(existsSync(resolve(publicDir, voucher.image.slice(1)))).toBe(true)
    }
  })

  it('formats amounts with Vietnamese thousands separators', () => {
    expect(formatVoucherAmount(10_000)).toBe('10.000')
    expect(formatVoucherAmount(500_000)).toBe('500.000')
  })
})
