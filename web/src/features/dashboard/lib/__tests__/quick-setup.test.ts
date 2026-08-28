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
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'

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
    assert.equal(
      normalizeGatewayBaseUrl('https://api.example.com///'),
      'https://api.example.com'
    )
  })
})

describe('openaiCompatibleBaseUrl', () => {
  test('appends /v1 when the origin has no version suffix', () => {
    assert.equal(
      openaiCompatibleBaseUrl('https://api.example.com'),
      'https://api.example.com/v1'
    )
  })

  test('does not double an existing /v1 suffix', () => {
    assert.equal(
      openaiCompatibleBaseUrl('https://api.example.com/v1/'),
      'https://api.example.com/v1'
    )
  })
})

describe('formatGatewayApiKey', () => {
  test('prefixes sk- when the stored token has no prefix', () => {
    assert.equal(formatGatewayApiKey('abc123'), 'sk-abc123')
  })

  test('leaves an already-prefixed key unchanged', () => {
    assert.equal(formatGatewayApiKey('sk-abc123'), 'sk-abc123')
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
    assert.equal(pickDefaultQuickSetupModel(models), 'claude-sonnet-4-6')
  })

  test('picks sonnet model accurately', () => {
    assert.equal(pickDefaultSonnetModel(models), 'claude-sonnet-4-6')
  })

  test('picks opus model accurately', () => {
    assert.equal(pickDefaultOpusModel(models), 'claude-opus-4')
  })

  test('picks haiku model accurately', () => {
    assert.equal(pickDefaultHaikuModel(models), 'claude-3-5-haiku')
  })

  test('returns an empty string when the model list is empty', () => {
    assert.equal(pickDefaultQuickSetupModel([]), '')
  })
})

describe('resolveGatewayServerAddress', () => {
  test('uses server_address from status when present', () => {
    assert.equal(
      resolveGatewayServerAddress({
        server_address: 'https://gw.example.com/',
      }),
      'https://gw.example.com'
    )
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

    assert.equal(parsed.env.ANTHROPIC_BASE_URL, 'https://gw.example.com')
    assert.equal(parsed.env.ANTHROPIC_AUTH_TOKEN, 'sk-abc123')
    assert.equal(parsed.env.ANTHROPIC_MODEL, 'claude-sonnet-4')
    assert.equal(parsed.env.ANTHROPIC_DEFAULT_HAIKU_MODEL, 'claude-3-5-haiku')
    assert.equal(parsed.env.ANTHROPIC_DEFAULT_SONNET_MODEL, 'claude-3-7-sonnet')
    assert.equal(parsed.env.ANTHROPIC_DEFAULT_OPUS_MODEL, 'claude-opus-4')
    assert.equal(parsed.env.ANTHROPIC_DEFAULT_FABLE_MODEL, 'claude-3-5-haiku')
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

    assert.match(
      snippet,
      /export ANTHROPIC_BASE_URL='https:\/\/gw\.example\.com'/
    )
    assert.match(snippet, /export ANTHROPIC_AUTH_TOKEN='sk-abc123'/)
    assert.match(snippet, /export ANTHROPIC_MODEL='claude-sonnet-4'/)
    assert.match(
      snippet,
      /export ANTHROPIC_DEFAULT_SONNET_MODEL='claude-sonnet-4'/
    )
    assert.match(snippet, /export ANTHROPIC_DEFAULT_OPUS_MODEL='claude-opus-4'/)
    assert.match(
      snippet,
      /export ANTHROPIC_DEFAULT_HAIKU_MODEL='claude-3-5-haiku'/
    )
  })
})

describe('buildOpenCodeSnippet', () => {
  test('writes an OpenAI-compatible provider pointed at /v1 with multiple models', () => {
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
          options: { baseURL: string; apiKey: string }
          models: Record<string, { name: string }>
        }
      >
    }

    assert.equal(parsed.model, `${OPENCODE_PROVIDER_ID}/claude-sonnet-4`)
    assert.equal(
      parsed.provider[OPENCODE_PROVIDER_ID]?.options.baseURL,
      'https://gw.example.com/v1'
    )
    assert.equal(
      parsed.provider[OPENCODE_PROVIDER_ID]?.options.apiKey,
      'sk-abc123'
    )
    assert.equal(
      parsed.provider[OPENCODE_PROVIDER_ID]?.models['claude-sonnet-4']?.name,
      'claude-sonnet-4'
    )
    assert.equal(
      parsed.provider[OPENCODE_PROVIDER_ID]?.models['gpt-4.1']?.name,
      'gpt-4.1'
    )
    assert.equal(
      parsed.provider[OPENCODE_PROVIDER_ID]?.models['deepseek-r1']?.name,
      'deepseek-r1'
    )
    assert.doesNotMatch(snippet, new RegExp(QUICK_SETUP_API_KEY_PLACEHOLDER))
  })
})

describe('buildOmpSnippet', () => {
  test('writes an Oh My Pi provider YAML config pointed at /v1 with multiple models', () => {
    const snippet = buildOmpSnippet({
      baseUrl: 'https://gw.example.com',
      apiKey: 'sk-abc123',
      models: ['claude-sonnet-4', 'gpt-4.1'],
    })

    assert.match(snippet, /^providers:\n/)
    assert.match(snippet, new RegExp(`  ${OMP_PROVIDER_ID}:\n`))
    assert.match(snippet, /baseUrl: https:\/\/gw\.example\.com\/v1/)
    assert.match(snippet, /apiKey: sk-abc123/)
    assert.match(snippet, /api: openai-completions/)
    assert.match(snippet, /- id: claude-sonnet-4/)
    assert.match(snippet, /name: claude-sonnet-4/)
    assert.match(snippet, /- id: gpt-4.1/)
    assert.match(snippet, /name: gpt-4.1/)
    assert.doesNotMatch(snippet, new RegExp(QUICK_SETUP_API_KEY_PLACEHOLDER))
  })
})
