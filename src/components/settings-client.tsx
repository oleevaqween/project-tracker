'use client';

import * as React from 'react';
import {
  BotIcon,
  KeyIcon,
  GlobeIcon,
  SaveIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Loader2Icon,
  ServerIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  PROVIDER_MODELS,
  PROVIDER_LABELS,
  PROVIDER_KEY_LABELS,
  type AIConfig,
  type AIProvider,
} from '@/lib/ai/models';
import { updateAIConfig } from '@/actions/settings';

type ProviderOption = {
  id: AIProvider;
  label: string;
  description: string;
  icon: React.ElementType;
};

const PROVIDERS: ProviderOption[] = [
  { id: 'openai', label: 'OpenAI', description: 'GPT-4o, GPT-4.1, o3', icon: BotIcon },
  { id: 'anthropic', label: 'Anthropic', description: 'Claude Sonnet, Opus, Haiku', icon: BotIcon },
  { id: 'google', label: 'Google AI', description: 'Gemini 2.5 Pro/Flash', icon: GlobeIcon },
  { id: 'openrouter', label: 'OpenRouter', description: 'Access 100+ models via one API', icon: ServerIcon },
  { id: 'ollama', label: 'Ollama', description: 'Run models locally', icon: BotIcon },
];

export function SettingsClient({
  aiConfig: initialConfig,
  username,
}: {
  aiConfig: AIConfig | null;
  username: string;
}) {
  const [provider, setProvider] = React.useState<AIProvider>(initialConfig?.provider ?? 'openai');
  const [model, setModel] = React.useState(initialConfig?.model ?? 'gpt-4o-mini');
  const [apiKey, setApiKey] = React.useState('');
  const [baseUrl, setBaseUrl] = React.useState(initialConfig?.baseUrl ?? '');
  const [hasExistingKey, setHasExistingKey] = React.useState(!!initialConfig?.apiKeyEncrypted);
  const [saving, setSaving] = React.useState(false);
  const [saveResult, setSaveResult] = React.useState<{ success: boolean; message: string } | null>(null);

  const models = PROVIDER_MODELS[provider];
  const needsApiKey = provider !== 'ollama';
  const keyLabel = PROVIDER_KEY_LABELS[provider];

  // Reset model when provider changes
  React.useEffect(() => {
    const newModels = PROVIDER_MODELS[provider];
    if (!newModels.find((m) => m.id === model)) {
      setModel(newModels[0].id);
    }
  }, [provider, model]);

  async function handleSave() {
    setSaving(true);
    setSaveResult(null);

    const config: AIConfig = {
      provider,
      model,
      baseUrl: provider === 'openrouter' || provider === 'ollama' ? baseUrl || undefined : undefined,
      apiKeyEncrypted: apiKey || undefined,
    };

    const result = await updateAIConfig(config);

    if (result.success) {
      setHasExistingKey(!!apiKey || !!initialConfig?.apiKeyEncrypted);
      setApiKey('');
      setSaveResult({ success: true, message: 'Settings saved successfully!' });
    } else {
      setSaveResult({ success: false, message: result.error ?? 'Failed to save settings' });
    }

    setSaving(false);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your AI provider and application preferences
        </p>
      </div>

      {/* AI Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BotIcon className="size-5" />
            AI Provider
          </CardTitle>
          <CardDescription>
            Choose your AI provider and model. Your API key is stored securely in your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label>Provider</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 text-center transition-colors',
                    provider === p.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-muted hover:border-muted-foreground/30'
                  )}
                >
                  <p.icon className="size-5" />
                  <span className="text-sm font-medium">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Or type a custom model ID below
            </p>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Model ID"
              className="text-sm"
            />
          </div>

          <Separator />

          {/* API Key */}
          {needsApiKey && (
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="flex items-center gap-1.5">
                <KeyIcon className="size-3.5" />
                API Key
              </Label>
              {hasExistingKey && !apiKey ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    value="••••••••••••••••"
                    disabled
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHasExistingKey(false);
                      setApiKey('');
                    }}
                  >
                    Replace
                  </Button>
                </div>
              ) : (
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={keyLabel}
                  className="flex-1"
                />
              )}
              <p className="text-xs text-muted-foreground">
                Your key is stored securely and never sent to third parties. Environment variable: {keyLabel}
              </p>
            </div>
          )}

          {/* Base URL (for OpenRouter/Ollama) */}
          {(provider === 'openrouter' || provider === 'ollama') && (
            <div className="space-y-2">
              <Label htmlFor="baseUrl" className="flex items-center gap-1.5">
                <GlobeIcon className="size-3.5" />
                Base URL
              </Label>
              <Input
                id="baseUrl"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={
                  provider === 'openrouter'
                    ? 'https://openrouter.ai/api/v1'
                    : 'http://localhost:11434/v1'
                }
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {provider === 'openrouter'
                  ? 'Default: https://openrouter.ai/api/v1'
                  : 'Default: http://localhost:11434/v1'}
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="size-4" />
                  Save Settings
                </>
              )}
            </Button>

            {saveResult && (
              <div
                className={cn(
                  'flex items-center gap-1.5 text-sm',
                  saveResult.success ? 'text-green-600' : 'text-destructive'
                )}
              >
                {saveResult.success ? (
                  <CheckCircle2Icon className="size-4" />
                ) : (
                  <AlertCircleIcon className="size-4" />
                )}
                {saveResult.message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Username</span>
            <span className="font-medium">{username}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">AI Provider</span>
            <span className="font-medium">
              {initialConfig ? PROVIDER_LABELS[initialConfig.provider] : 'Not configured'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Model</span>
            <span className="font-medium font-mono text-xs">
              {initialConfig?.model ?? '—'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}