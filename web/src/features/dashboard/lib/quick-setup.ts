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
export const QUICK_SETUP_API_KEY_PLACEHOLDER = 'sk-••••••••'
export const OPENCODE_PROVIDER_ID = 'newapi'
export const OMP_PROVIDER_ID = 'newapi'
export const CLAUDE_CODE_MODEL_PLACEHOLDER = 'your-model'

export type ClaudeCodeSnippetFormat = 'settings' | 'shell'
export type QuickSetupClient = 'claude' | 'opencode' | 'omp'
export type OpenCodeSnippetApi = 'anthropic' | 'openai-compatible'
export type OmpSnippetApi = 'anthropic-messages' | 'openai-completions'

export interface ClaudeCodeModels {
  primary?: string
  sonnet?: string
  opus?: string
  haiku?: string
}

export function normalizeGatewayBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '')
}

export function openaiCompatibleBaseUrl(raw: string): string {
  const normalized = normalizeGatewayBaseUrl(raw)
  if (!normalized) return ''
  return normalized.endsWith('/v1') ? normalized : `${normalized}/v1`
}

export function formatGatewayApiKey(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('sk-') ? trimmed : `sk-${trimmed}`
}

export function pickDefaultQuickSetupModel(models: string[]): string {
  const preferred = [
    /claude-sonnet-4/,
    /claude-3-7-sonnet/,
    /claude-3-5-sonnet/,
    /claude-sonnet/,
    /claude-opus/,
    /sonnet/,
    /claude/,
  ]
  for (const pattern of preferred) {
    const match = models.find((model) => pattern.test(model))
    if (match) return match
  }
  return models[0] ?? ''
}

export function pickDefaultSonnetModel(models: string[]): string {
  const preferred = [
    /claude-sonnet-4/,
    /claude-3-7-sonnet/,
    /claude-3-5-sonnet/,
    /claude-sonnet/,
    /sonnet/,
  ]
  for (const pattern of preferred) {
    const match = models.find((model) => pattern.test(model))
    if (match) return match
  }
  return pickDefaultQuickSetupModel(models)
}

export function pickDefaultOpusModel(models: string[]): string {
  const preferred = [/claude-opus-4/, /claude-3-opus/, /claude-opus/, /opus/]
  for (const pattern of preferred) {
    const match = models.find((model) => pattern.test(model))
    if (match) return match
  }
  return pickDefaultQuickSetupModel(models)
}

export function pickDefaultHaikuModel(models: string[]): string {
  const preferred = [
    /claude-3-5-haiku/,
    /claude-haiku-4/,
    /claude-3-haiku/,
    /claude-haiku/,
    /haiku/,
  ]
  for (const pattern of preferred) {
    const match = models.find((model) => pattern.test(model))
    if (match) return match
  }
  return pickDefaultQuickSetupModel(models)
}

export function resolveGatewayServerAddress(status: unknown): string {
  if (status && typeof status === 'object') {
    const record = status as Record<string, unknown>
    const nested =
      record.data && typeof record.data === 'object'
        ? (record.data as Record<string, unknown>)
        : undefined
    const candidate =
      record.server_address ??
      record.serverAddress ??
      nested?.server_address ??
      nested?.serverAddress
    if (typeof candidate === 'string' && candidate.trim()) {
      return normalizeGatewayBaseUrl(candidate)
    }
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return normalizeGatewayBaseUrl(window.location.origin)
  }
  return ''
}

function claudeCodeEnv(
  baseUrl: string,
  apiKey: string,
  models: ClaudeCodeModels | string
): Record<string, string> {
  const m = typeof models === 'string' ? { primary: models } : models
  const primary = m.primary?.trim() || CLAUDE_CODE_MODEL_PLACEHOLDER
  const sonnet = m.sonnet?.trim() || primary
  const opus = m.opus?.trim() || primary
  const haiku = m.haiku?.trim() || primary

  return {
    ANTHROPIC_BASE_URL: normalizeGatewayBaseUrl(baseUrl),
    ANTHROPIC_AUTH_TOKEN:
      formatGatewayApiKey(apiKey) || QUICK_SETUP_API_KEY_PLACEHOLDER,
    ANTHROPIC_MODEL: primary,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: haiku,
    ANTHROPIC_DEFAULT_SONNET_MODEL: sonnet,
    ANTHROPIC_DEFAULT_OPUS_MODEL: opus,
    ANTHROPIC_DEFAULT_FABLE_MODEL: haiku,
  }
}

export function buildClaudeCodeSnippet(input: {
  baseUrl: string
  apiKey: string
  models: ClaudeCodeModels | string
  format: ClaudeCodeSnippetFormat
}): string {
  const env = claudeCodeEnv(input.baseUrl, input.apiKey, input.models)
  if (input.format === 'shell') {
    return Object.entries(env)
      .map(
        ([key, value]) => `export ${key}='${value.replaceAll("'", "'\\''")}'`
      )
      .join('\n')
  }
  return `${JSON.stringify({ env }, null, 2)}\n`
}

export function buildOpenCodeSnippet(input: {
  baseUrl: string
  apiKey: string
  models: string[] | string
  api?: OpenCodeSnippetApi
}): string {
  const modelList = Array.isArray(input.models)
    ? input.models.filter(Boolean)
    : [input.models].filter(Boolean)
  const resolvedModels =
    modelList.length > 0 ? modelList : [CLAUDE_CODE_MODEL_PLACEHOLDER]
  const primaryModel = resolvedModels[0]

  const modelsMap: Record<string, { name: string }> = {}
  for (const m of resolvedModels) {
    modelsMap[m] = { name: m }
  }

  const config = {
    $schema: 'https://opencode.ai/config.json',
    model: `${OPENCODE_PROVIDER_ID}/${primaryModel}`,
    provider: {
      [OPENCODE_PROVIDER_ID]: {
        npm:
          (input.api ?? 'anthropic') === 'anthropic'
            ? '@ai-sdk/anthropic'
            : '@ai-sdk/openai-compatible',
        name: 'New API',
        options: {
          baseURL: openaiCompatibleBaseUrl(input.baseUrl),
          apiKey:
            formatGatewayApiKey(input.apiKey) ||
            QUICK_SETUP_API_KEY_PLACEHOLDER,
        },
        models: modelsMap,
      },
    },
  }
  return `${JSON.stringify(config, null, 2)}\n`
}

export function buildOmpSnippet(input: {
  baseUrl: string
  apiKey: string
  models: string[] | string
  api?: OmpSnippetApi
}): string {
  const modelList = Array.isArray(input.models)
    ? input.models.filter(Boolean)
    : [input.models].filter(Boolean)
  const resolvedModels =
    modelList.length > 0 ? modelList : [CLAUDE_CODE_MODEL_PLACEHOLDER]
  const resolvedApiKey =
    formatGatewayApiKey(input.apiKey) || QUICK_SETUP_API_KEY_PLACEHOLDER
  const anthropicApi =
    (input.api ?? 'anthropic-messages') === 'anthropic-messages'
  // OMP joins the Anthropic Messages URL as {baseUrl}/v1/messages, so the
  // provider baseUrl must stay at the origin; the OpenAI surface expects /v1.
  const resolvedBaseUrl = anthropicApi
    ? normalizeGatewayBaseUrl(input.baseUrl)
    : openaiCompatibleBaseUrl(input.baseUrl)

  const lines = [
    'providers:',
    `  ${OMP_PROVIDER_ID}:`,
    `    baseUrl: ${resolvedBaseUrl}`,
    anthropicApi
      ? '    api: anthropic-messages'
      : '    api: openai-completions',
    `    apiKey: ${resolvedApiKey}`,
    '    models:',
  ]
  for (const m of resolvedModels) {
    lines.push(`      - id: ${m}`)
    lines.push(`        name: ${m}`)
  }
  return `${lines.join('\n')}\n`
}
