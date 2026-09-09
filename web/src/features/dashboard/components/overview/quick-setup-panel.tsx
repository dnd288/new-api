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
import { Link } from '@tanstack/react-router'
import { Check, Copy, Terminal } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { MultiSelect } from '@/components/multi-select'
import { Button } from '@/components/ui/button'
import { ComboboxInput } from '@/components/ui/combobox-input'
import { IconBadge } from '@/components/ui/icon-badge'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  buildClaudeCodeSnippet,
  buildOmpSnippet,
  buildOpenCodeSnippet,
  formatGatewayApiKey,
  pickDefaultHaikuModel,
  pickDefaultOpusModel,
  pickDefaultQuickSetupModel,
  pickDefaultSonnetModel,
  resolveGatewayServerAddress,
  QUICK_SETUP_API_KEY_PLACEHOLDER,
  type ClaudeCodeModels,
  type ClaudeCodeSnippetFormat,
  type OmpSnippetApi,
  type OpenCodeSnippetApi,
  type QuickSetupClient,
} from '@/features/dashboard/lib/quick-setup'
import { fetchTokenKey, getApiKeys } from '@/features/keys/api'
import { API_KEY_STATUS } from '@/features/keys/constants'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { useStatus } from '@/hooks/use-status'
import { getUserModels } from '@/lib/api'

import { PanelWrapper } from '../ui/panel-wrapper'

export function QuickSetupPanel() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const { copiedText, copyToClipboard } = useCopyToClipboard({ notify: true })
  const [client, setClient] = useState<QuickSetupClient>('claude')
  const [claudeFormat, setClaudeFormat] =
    useState<ClaudeCodeSnippetFormat>('settings')
  const [opencodeApi, setOpencodeApi] =
    useState<OpenCodeSnippetApi>('anthropic')
  const [ompApi, setOmpApi] = useState<OmpSnippetApi>('anthropic-messages')
  const [selectedKeyId, setSelectedKeyId] = useState('')

  // Claude models state
  const [selectedPrimaryModel, setSelectedPrimaryModel] = useState('')
  const [selectedSonnetModel, setSelectedSonnetModel] = useState('')
  const [selectedOpusModel, setSelectedOpusModel] = useState('')
  const [selectedHaikuModel, setSelectedHaikuModel] = useState('')

  // Multi-models state for OpenCode and OMP
  const [selectedMultiModels, setSelectedMultiModels] = useState<string[]>([])
  const [isCopyingKey, setIsCopyingKey] = useState(false)

  const keysQuery = useQuery({
    queryKey: ['overview-quick-setup-keys'],
    queryFn: () => getApiKeys({ p: 1, size: 100 }),
    staleTime: 5 * 60 * 1000,
  })
  const modelsQuery = useQuery({
    queryKey: ['user-models'],
    queryFn: getUserModels,
    staleTime: 5 * 60 * 1000,
  })

  const enabledKeys = useMemo(
    () =>
      (keysQuery.data?.data?.items ?? []).filter(
        (item) => item.status === API_KEY_STATUS.ENABLED
      ),
    [keysQuery.data?.data?.items]
  )
  const models = modelsQuery.data?.data ?? []
  const keyOptions = useMemo(
    () =>
      enabledKeys.map((item) => ({
        value: String(item.id),
        label: item.name || `sk-…${item.id}`,
      })),
    [enabledKeys]
  )
  const modelOptions = useMemo(
    () =>
      (modelsQuery.data?.data ?? []).map((item) => ({
        value: item,
        label: item,
      })),
    [modelsQuery.data?.data]
  )

  const firstEnabledKeyId = enabledKeys[0] ? String(enabledKeys[0].id) : ''
  const keyId = selectedKeyId || firstEnabledKeyId
  const keyIdNumber = Number(keyId)

  // Claude models resolution
  const primaryModel =
    selectedPrimaryModel || pickDefaultQuickSetupModel(models)
  const sonnetModel =
    selectedSonnetModel || pickDefaultSonnetModel(models) || primaryModel
  const opusModel =
    selectedOpusModel || pickDefaultOpusModel(models) || primaryModel
  const haikuModel =
    selectedHaikuModel || pickDefaultHaikuModel(models) || primaryModel

  const claudeModelsConfig: ClaudeCodeModels = {
    primary: primaryModel,
    sonnet: sonnetModel,
    opus: opusModel,
    haiku: haikuModel,
  }

  // OpenCode & OMP multi-models resolution
  const effectiveMultiModels =
    selectedMultiModels.length > 0
      ? selectedMultiModels
      : [pickDefaultQuickSetupModel(models)].filter(Boolean)

  const baseUrl = resolveGatewayServerAddress(status)
  const apiKey = QUICK_SETUP_API_KEY_PLACEHOLDER

  let snippet = ''
  if (client === 'claude') {
    snippet = buildClaudeCodeSnippet({
      baseUrl,
      apiKey,
      models: claudeModelsConfig,
      format: claudeFormat,
    })
  } else if (client === 'opencode') {
    snippet = buildOpenCodeSnippet({
      baseUrl,
      apiKey,
      models: effectiveMultiModels,
      api: opencodeApi,
    })
  } else {
    snippet = buildOmpSnippet({
      baseUrl,
      apiKey,
      models: effectiveMultiModels,
      api: ompApi,
    })
  }

  const hasModelsSelected =
    client === 'claude'
      ? Boolean(primaryModel)
      : effectiveMultiModels.length > 0
  const canCopy =
    Number.isFinite(keyIdNumber) &&
    keyIdNumber > 0 &&
    hasModelsSelected &&
    Boolean(baseUrl)
  const isCopied = Boolean(copiedText) && !isCopyingKey

  let snippetLabel = '~/.claude/settings.json'
  let footerHelpText = t('Paste into ~/.claude/settings.json, then run claude.')
  if (client === 'claude') {
    if (claudeFormat === 'shell') {
      snippetLabel = t('Shell')
      footerHelpText = t(
        'Run these commands in your shell before starting Claude Code.'
      )
    }
  } else if (client === 'opencode') {
    snippetLabel = '~/.config/opencode/opencode.json'
    footerHelpText = t(
      'Save as ~/.config/opencode/opencode.json, then run opencode.'
    )
  } else {
    snippetLabel = '~/.omp/agent/models.yml'
    footerHelpText = t('Save as ~/.omp/agent/models.yml, then run omp.')
  }

  let apiHint = ''
  if (client === 'opencode') {
    apiHint =
      opencodeApi === 'anthropic'
        ? t('Anthropic Messages API. Recommended for Claude models.')
        : t('OpenAI-compatible Chat Completions API.')
  } else if (client === 'omp') {
    apiHint =
      ompApi === 'anthropic-messages'
        ? t('Anthropic Messages API. Recommended for Claude models.')
        : t('OpenAI-compatible Chat Completions API.')
  }

  let apiSelector: ReactNode
  if (client === 'claude') {
    apiSelector = (
      <span className='font-mono text-xs'>Anthropic Messages API</span>
    )
  } else if (client === 'opencode') {
    apiSelector = (
      <Tabs
        value={opencodeApi}
        onValueChange={(value) => setOpencodeApi(value as OpenCodeSnippetApi)}
      >
        <TabsList className='h-8'>
          <TabsTrigger value='anthropic' className='font-mono text-xs'>
            @ai-sdk/anthropic
          </TabsTrigger>
          <TabsTrigger value='openai-compatible' className='font-mono text-xs'>
            @ai-sdk/openai-compatible
          </TabsTrigger>
        </TabsList>
      </Tabs>
    )
  } else {
    apiSelector = (
      <Tabs
        value={ompApi}
        onValueChange={(value) => setOmpApi(value as OmpSnippetApi)}
      >
        <TabsList className='h-8'>
          <TabsTrigger value='anthropic-messages' className='font-mono text-xs'>
            anthropic-messages
          </TabsTrigger>
          <TabsTrigger value='openai-completions' className='font-mono text-xs'>
            openai-completions
          </TabsTrigger>
        </TabsList>
      </Tabs>
    )
  }

  return (
    <PanelWrapper
      title={
        <span className='flex items-center gap-2'>
          <IconBadge tone='primary' size='sm'>
            <Terminal />
          </IconBadge>
          {t('Quick setup')}
        </span>
      }
      description={t(
        'Point Claude Code, OpenCode, or Oh My Pi at this gateway'
      )}
    >
      <div className='flex flex-col gap-4'>
        <Tabs
          value={client}
          onValueChange={(value) => setClient(value as QuickSetupClient)}
        >
          <TabsList>
            <TabsTrigger value='claude'>Claude Code</TabsTrigger>
            <TabsTrigger value='opencode'>OpenCode</TabsTrigger>
            <TabsTrigger value='omp'>Oh My Pi (OMP)</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className='space-y-2'>
          <div className='flex flex-wrap items-center gap-3'>
            <span className='text-muted-foreground text-xs'>{t('API')}</span>
            {apiSelector}
          </div>
          {apiHint ? (
            <p className='text-muted-foreground text-xs'>{apiHint}</p>
          ) : null}
        </div>

        <div className='space-y-3'>
          <div className='min-w-0 space-y-2'>
            <Label htmlFor='overview-quick-setup-key'>{t('API Key')}</Label>
            <ComboboxInput
              id='overview-quick-setup-key'
              options={keyOptions}
              value={keyId}
              onValueChange={setSelectedKeyId}
              placeholder={t('Select an API key')}
              emptyText={t('No API Keys Found')}
            />
            {enabledKeys.length === 0 && !keysQuery.isLoading ? (
              <p className='text-muted-foreground text-xs'>
                {t('No API keys yet. Create one to generate setup commands.')}{' '}
                <Button
                  variant='link'
                  className='h-auto p-0 text-xs'
                  render={<Link to='/keys' />}
                >
                  {t('Create API Key')}
                </Button>
              </p>
            ) : null}
          </div>

          {client === 'claude' ? (
            <div className='space-y-2'>
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='min-w-0 space-y-1.5'>
                  <Label htmlFor='overview-quick-setup-primary-model'>
                    {t('Primary Model')}
                  </Label>
                  <ComboboxInput
                    id='overview-quick-setup-primary-model'
                    options={modelOptions}
                    value={primaryModel}
                    onValueChange={setSelectedPrimaryModel}
                    placeholder={t('Select or enter model name')}
                    emptyText={t('No models found')}
                    allowCustomValue
                  />
                </div>
                <div className='min-w-0 space-y-1.5'>
                  <Label htmlFor='overview-quick-setup-sonnet-model'>
                    {t('Sonnet Model')}
                  </Label>
                  <ComboboxInput
                    id='overview-quick-setup-sonnet-model'
                    options={modelOptions}
                    value={sonnetModel}
                    onValueChange={setSelectedSonnetModel}
                    placeholder={t('Select or enter model name')}
                    emptyText={t('No models found')}
                    allowCustomValue
                  />
                </div>
                <div className='min-w-0 space-y-1.5'>
                  <Label htmlFor='overview-quick-setup-opus-model'>
                    {t('Opus Model')}
                  </Label>
                  <ComboboxInput
                    id='overview-quick-setup-opus-model'
                    options={modelOptions}
                    value={opusModel}
                    onValueChange={setSelectedOpusModel}
                    placeholder={t('Select or enter model name')}
                    emptyText={t('No models found')}
                    allowCustomValue
                  />
                </div>
                <div className='min-w-0 space-y-1.5'>
                  <Label htmlFor='overview-quick-setup-haiku-model'>
                    {t('Haiku Model')}
                  </Label>
                  <ComboboxInput
                    id='overview-quick-setup-haiku-model'
                    options={modelOptions}
                    value={haikuModel}
                    onValueChange={setSelectedHaikuModel}
                    placeholder={t('Select or enter model name')}
                    emptyText={t('No models found')}
                    allowCustomValue
                  />
                </div>
              </div>
              <p className='text-muted-foreground text-xs'>
                {t(
                  'Configure specific model aliases for Claude Code (Primary, Sonnet, Opus, Haiku).'
                )}
              </p>
            </div>
          ) : (
            <div className='space-y-2'>
              <div className='min-w-0 space-y-1.5'>
                <Label htmlFor='overview-quick-setup-multi-models'>
                  {t('Models')}
                </Label>
                <MultiSelect
                  id='overview-quick-setup-multi-models'
                  options={modelOptions}
                  selected={effectiveMultiModels}
                  onChange={setSelectedMultiModels}
                  placeholder={t('Select models...')}
                  allowCreate
                  emptyText={t('No models found')}
                />
              </div>
              <p className='text-muted-foreground text-xs'>
                {client === 'opencode'
                  ? t('Selected models will be configured for OpenCode.')
                  : t('Selected models will be configured for Oh My Pi (OMP).')}
              </p>
            </div>
          )}
        </div>

        <div className='space-y-2'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <span className='text-muted-foreground font-mono text-xs'>
              {snippetLabel}
            </span>
            <div className='flex items-center gap-2'>
              {client === 'claude' ? (
                <Tabs
                  value={claudeFormat}
                  onValueChange={(value) =>
                    setClaudeFormat(value as ClaudeCodeSnippetFormat)
                  }
                >
                  <TabsList className='h-8'>
                    <TabsTrigger value='settings' className='text-xs'>
                      {t('Settings file')}
                    </TabsTrigger>
                    <TabsTrigger value='shell' className='text-xs'>
                      {t('Shell')}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              ) : null}
              <Button
                type='button'
                size='sm'
                variant='outline'
                className='gap-1.5'
                disabled={!canCopy || isCopyingKey}
                onClick={() => {
                  void (async () => {
                    setIsCopyingKey(true)
                    try {
                      const result = await fetchTokenKey(keyIdNumber)
                      const realKey = formatGatewayApiKey(
                        result.data?.key ?? ''
                      )
                      if (!realKey) {
                        return
                      }
                      let realSnippet = ''
                      if (client === 'claude') {
                        realSnippet = buildClaudeCodeSnippet({
                          baseUrl,
                          apiKey: realKey,
                          models: claudeModelsConfig,
                          format: claudeFormat,
                        })
                      } else if (client === 'opencode') {
                        realSnippet = buildOpenCodeSnippet({
                          baseUrl,
                          apiKey: realKey,
                          models: effectiveMultiModels,
                          api: opencodeApi,
                        })
                      } else {
                        realSnippet = buildOmpSnippet({
                          baseUrl,
                          apiKey: realKey,
                          models: effectiveMultiModels,
                          api: ompApi,
                        })
                      }
                      await copyToClipboard(realSnippet)
                    } finally {
                      setIsCopyingKey(false)
                    }
                  })()
                }}
              >
                {isCopied ? <Check className='text-success' /> : <Copy />}
                {isCopied ? t('Copied!') : t('Copy')}
              </Button>
            </div>
          </div>
          <div className='bg-muted/40 overflow-x-auto rounded-lg border'>
            <pre className='p-3 font-mono text-xs leading-relaxed whitespace-pre'>
              {snippet}
            </pre>
          </div>
          <p className='text-muted-foreground text-xs'>{footerHelpText}</p>
        </div>
      </div>
    </PanelWrapper>
  )
}
