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
import { createInstance } from 'i18next'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { VoucherSection } from '../components/voucher-section'

vi.mock('../api', () => ({
  getMezonTransactions: vi.fn(async () => ({ success: true, data: [] })),
}))

const i18n = createInstance()
await i18n.use(initReactI18next).init({
  lng: 'en',
  resources: {
    en: {
      translation: {
        'Mezon Đồng': 'Mezon Đồng',
        'Select a voucher to top up': 'Select a voucher to top up',
        'Transfer exactly {{amount}} đồng (1 đồng = 1 mzđ) from your bound Mezon wallet.':
          'Transfer exactly {{amount}} đồng (1 đồng = 1 mzđ) from your bound Mezon wallet.',
        'Scan QR': 'Scan QR',
        'Find my transactions': 'Find my transactions',
        đồng: 'đồng',
        'No unclaimed transactions found. Paste a hash manually.':
          'No unclaimed transactions found. Paste a hash manually.',
        'Paste the transaction hash (0x…)': 'Paste the transaction hash (0x…)',
        'Transaction hash': 'Transaction hash',
        Claim: 'Claim',
        'Copy address': 'Copy address',
        'Copy failed, please copy manually':
          'Copy failed, please copy manually',
      },
    },
  },
})

function SectionHarness(props: {
  onClaim: (txHash: string) => Promise<boolean>
}) {
  return (
    <I18nextProvider i18n={i18n}>
      <VoucherSection
        treasuryAddress='0x1234567890abcdef1234567890abcdef12345678'
        onClaim={props.onClaim}
        claiming={false}
      />
    </I18nextProvider>
  )
}

afterEach(() => {
  cleanup()
})

describe('VoucherSection', () => {
  it('renders the six voucher denominations and no selection by default', async () => {
    render(<SectionHarness onClaim={vi.fn(async () => true)} />)

    for (const name of [
      '10.000 đồng',
      '20.000 đồng',
      '50.000 đồng',
      '100.000 đồng',
      '200.000 đồng',
      '500.000 đồng',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    expect(screen.getByText('Select a voucher to top up')).toBeInTheDocument()
  })

  it('pins the exact amount after selection and still claims via the hash input', async () => {
    const user = userEvent.setup()
    const onClaim = vi.fn(async () => true)
    render(<SectionHarness onClaim={onClaim} />)

    await user.click(screen.getByRole('button', { name: '50.000 đồng' }))
    expect(
      screen.getByText(
        'Transfer exactly 50.000 đồng (1 đồng = 1 mzđ) from your bound Mezon wallet.'
      )
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText('Transaction hash'), 'a'.repeat(64))
    await user.click(screen.getByRole('button', { name: 'Claim' }))
    expect(onClaim).toHaveBeenCalledWith('a'.repeat(64))
  })
})
