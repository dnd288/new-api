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
import { cleanup, render, screen } from '@testing-library/react'
import { createInstance } from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { afterEach, describe, expect, it } from 'vitest'

import { VoucherSection } from '../components/voucher-section'

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        'Mezon Đồng Voucher': 'Mezon Đồng Voucher',
        'Buy a voucher in any denomination (10.000 – 500.000 đồng) at cobar.vn, then redeem the code below to top up your balance.':
          'Buy a voucher in any denomination (10.000 – 500.000 đồng) at cobar.vn, then redeem the code below to top up your balance.',
        'Buy Voucher': 'Buy Voucher',
      },
    },
  },
})

function SectionHarness() {
  return (
    <I18nextProvider i18n={i18n}>
      <VoucherSection />
    </I18nextProvider>
  )
}

afterEach(() => {
  cleanup()
})

describe('VoucherSection', () => {
  it('links to the cobar.vn voucher store in a new tab', () => {
    render(<SectionHarness />)

    const link = screen.getByRole('link', { name: 'Buy Voucher' })
    expect(link).toHaveAttribute(
      'href',
      'https://cobar.vn/products/voucher-mezon-llm-10k-mzd'
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('shows the purchase guidance without any claim or QR surface', () => {
    render(<SectionHarness />)

    expect(
      screen.getByText(
        'Buy a voucher in any denomination (10.000 – 500.000 đồng) at cobar.vn, then redeem the code below to top up your balance.'
      )
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Transaction hash')).not.toBeInTheDocument()
    expect(screen.queryByText(/Scan QR/i)).not.toBeInTheDocument()
  })
})
