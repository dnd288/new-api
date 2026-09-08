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

export interface VoucherDenomination {
  /** Fixed price in whole đồng; credited 1:1 as mzđ after claim. */
  amount: number
  /** Bundled artwork path served from web/public. */
  image: string
}

/** Fixed voucher catalog — mirrors the artwork in web/public/vouchers/. */
export const VOUCHER_DENOMINATIONS: VoucherDenomination[] = [
  { amount: 10_000, image: '/vouchers/voucher-10k.svg' },
  { amount: 20_000, image: '/vouchers/voucher-20k.svg' },
  { amount: 50_000, image: '/vouchers/voucher-50k.svg' },
  { amount: 100_000, image: '/vouchers/voucher-100k.svg' },
  { amount: 200_000, image: '/vouchers/voucher-200k.svg' },
  { amount: 500_000, image: '/vouchers/voucher-500k.svg' },
]

export function formatVoucherAmount(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount)
}
