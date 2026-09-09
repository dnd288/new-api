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
import { describe, expect, test } from 'vitest'

import {
  buildClaudeCodeSnippet,
  buildOmpSnippet,
  buildOpenCodeSnippet,
  formatGatewayApiKey,
  normalizeGatewayBaseUrl,
  openaiCompatibleBaseUrl,
  OMP_PROVIDER_ID,
  OPENCODE_PROVIDER_ID,
  pickDefaultHaikuModel,
  pickDefaultOpusModel,
  pickDefaultQuickSetupModel,
  pickDefaultSonnetModel,
  QUICK_SETUP_API_KEY_PLACEHOLDER,
  resolveGatewayServerAddress,
} from '../quick-setup'

describe('normalizeGatewayBaseUrl', () => {
  test('strips trailing slashes from an origin', () => {
    expect(normalizeGatewayBaseUrl('https://api.example.com///')).toBe(
      'https://api.example.com'
    )
  })
})

describe('openaiCompatibleBaseUrl', () => {
  test('appends /v1 when the origin has no version suffix', () => {
    expect(openaiCompatibleBaseUrl('https://api.example.com')).toBe(
      'https://api.example.com/v1'
    )
  })

  test('does not double an existing /v1 suffix', () => {
    expect(openaiCompatibleBaseUrl('https://api.example.com/v1/')).toBe(
      'https://api.example.com/v1'
    )
  })
})

describe('formatGatewayApiKey', () => {
  test('prefixes sk- when the stored token has no prefix', () => {
    expect(formatGatewayApiKey('abc123')).toBe('sk-abc123')
  })

  test('leaves an already-prefixed key unchanged', () => {
    expect(formatGatewayApiKey('sk-abc123')).toBe('sk-abc123')
  })
})

describe('pickDefaultQuickSetupModel and family pickers', () => {
  const models = [
    'gpt-4.1',
    'claude-opus-4',
    'claude-sonnet-4-6',
    'claude-3-5-haiku',
  ]

  test('prefers a Claude Sonnet 4 model for primary', () => {
    expect(pickDefaultQuickSetupModel(models)).toBe('claude-sonnet-4-6')
  })

  test('picks sonnet model accurately', () => {
    expect(pickDefaultSonnetModel(models)).toBe('claude-sonnet-4-6')
  })

  test('picks opus model accurately', () => {
    expect(pickDefaultOpusModel(models)).toBe('claude-opus-4')
  })

  test('picks haiku model accurately', () => {
    expect(pickDefaultHaikuModel(models)).toBe('claude-3-5-haiku')
  })

  test('returns an empty string when the model list is empty', () => {
    expect(pickDefaultQuickSetupModel([])).toBe('')
  })
})

describe('resolveGatewayServerAddress', () => {
  test('uses server_address from status when present', () => {
    expect(
      resolveGatewayServerAddress({
        server_address: 'https://gw.example.com/',
      })
    ).toBe('https://gw.example.com')
  })
})

describe('buildClaudeCodeSnippet', () => {
  test('settings snippet omits /v1 and maps specific models to Claude Code aliases', () => {
    const snippet = buildClaudeCodeSnippet({
      baseUrl: 'https://gw.example.com/',
      apiKey: 'abc123',
      models: {
        primary: 'claude-sonnet-4',
        sonnet: 'claude-3-7-sonnet',
        opus: 'claude-opus-4',
        haiku: 'claude-3-5-haiku',
      },
      format: 'settings',
    })
    const parsed = JSON.parse(snippet) as {
      env: Record<string, string>
    }

    expect(parsed.env.ANTHROPIC_BASE_URL).toBe('https://gw.example.com')
    expect(parsed.env.ANTHROPIC_AUTH_TOKEN).toBe('sk-abc123')
    expect(parsed.env.ANTHROPIC_MODEL).toBe('claude-sonnet-4')
    expect(parsed.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe('claude-3-5-haiku')
    expect(parsed.env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe('claude-3-7-sonnet')
    expect(parsed.env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe('claude-opus-4')
    expect(parsed.env.ANTHROPIC_DEFAULT_FABLE_MODEL).toBe('claude-3-5-haiku')
  })

  test('shell snippet exports specific alias models', () => {
    const snippet = buildClaudeCodeSnippet({
      baseUrl: 'https://gw.example.com',
      apiKey: 'sk-abc123',
      models: {
        primary: 'claude-sonnet-4',
        sonnet: 'claude-sonnet-4',
        opus: 'claude-opus-4',
        haiku: 'claude-3-5-haiku',
      },
      format: 'shell',
    })

    expect(snippet).toMatch(
      /export ANTHROPIC_BASE_URL='https:\/\/gw\.example\.com'/
    )
    expect(snippet).toMatch(/export ANTHROPIC_AUTH_TOKEN='sk-abc123'/)
    expect(snippet).toMatch(/export ANTHROPIC_MODEL='claude-sonnet-4'/)
    expect(snippet).toMatch(
      /export ANTHROPIC_DEFAULT_SONNET_MODEL='claude-sonnet-4'/
    )
    expect(snippet).toMatch(
      /export ANTHROPIC_DEFAULT_OPUS_MODEL='claude-opus-4'/
    )
    expect(snippet).toMatch(
      /export ANTHROPIC_DEFAULT_HAIKU_MODEL='claude-3-5-haiku'/
    )
  })
})

describe('buildOpenCodeSnippet', () => {
  test('defaults to an @ai-sdk/anthropic provider pointed at /v1 with multiple models', () => {
    const snippet = buildOpenCodeSnippet({
      baseUrl: 'https://gw.example.com',
      apiKey: 'sk-abc123',
      models: ['claude-sonnet-4', 'gpt-4.1', 'deepseek-r1'],
    })
    const parsed = JSON.parse(snippet) as {
      model: string
      provider: Record<
        string,
        {
          npm: string
          options: { baseURL: string; apiKey: string }
          models: Record<string, { name: string }>
        }
      >
    }
    const provider = parsed.provider[OPENCODE_PROVIDER_ID]

    expect(parsed.model).toBe(`${OPENCODE_PROVIDER_ID}/claude-sonnet-4`)
    expect(provider?.npm).toBe('@ai-sdk/anthropic')
    expect(provider?.options.baseURL).toBe('https://gw.example.com/v1')
    expect(provider?.options.apiKey).toBe('sk-abc123')
    expect(provider?.models['claude-sonnet-4']?.name).toBe('claude-sonnet-4')
    expect(provider?.models['gpt-4.1']?.name).toBe('gpt-4.1')
    expect(provider?.models['deepseek-r1']?.name).toBe('deepseek-r1')
    expect(snippet).not.toContain(QUICK_SETUP_API_KEY_PLACEHOLDER)
  })

  test('uses @ai-sdk/openai-compatible when the OpenAI-compatible API is selected', () => {
    const snippet = buildOpenCodeSnippet({
      baseUrl: 'https://gw.example.com',
      apiKey: 'sk-abc123',
      models: ['gpt-4.1'],
      api: 'openai-compatible',
    })
    const parsed = JSON.parse(snippet) as {
      provider: Record<string, { npm: string; options: { baseURL: string } }>
    }

    expect(parsed.provider[OPENCODE_PROVIDER_ID]?.npm).toBe(
      '@ai-sdk/openai-compatible'
    )
    expect(parsed.provider[OPENCODE_PROVIDER_ID]?.options.baseURL).toBe(
      'https://gw.example.com/v1'
    )
  })
})

describe('buildOmpSnippet', () => {
  test('defaults to anthropic-messages with the origin base URL', () => {
    const snippet = buildOmpSnippet({
      baseUrl: 'https://gw.example.com/',
      apiKey: 'sk-abc123',
      models: ['claude-sonnet-4'],
    })

    expect(snippet).toMatch(/^providers:\n/)
    expect(snippet).toContain(`  ${OMP_PROVIDER_ID}:\n`)
    expect(snippet).toContain('baseUrl: https://gw.example.com\n')
    expect(snippet).toContain('api: anthropic-messages\n')
    expect(snippet).toContain('apiKey: sk-abc123\n')
    expect(snippet).toContain('- id: claude-sonnet-4\n')
    expect(snippet).toContain('name: claude-sonnet-4\n')
    expect(snippet).not.toContain(QUICK_SETUP_API_KEY_PLACEHOLDER)
  })

  test('writes openai-completions pointed at /v1 with multiple models when selected', () => {
    const snippet = buildOmpSnippet({
      baseUrl: 'https://gw.example.com',
      apiKey: 'sk-abc123',
      models: ['claude-sonnet-4', 'gpt-4.1'],
      api: 'openai-completions',
    })

    expect(snippet).toContain('baseUrl: https://gw.example.com/v1\n')
    expect(snippet).toContain('api: openai-completions\n')
    expect(snippet).toContain('apiKey: sk-abc123\n')
    expect(snippet).toContain('- id: claude-sonnet-4\n')
    expect(snippet).toContain('- id: gpt-4.1\n')
    expect(snippet).toContain('name: gpt-4.1\n')
    expect(snippet).not.toContain(QUICK_SETUP_API_KEY_PLACEHOLDER)
  })
})
