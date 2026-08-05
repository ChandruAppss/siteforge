/* Provider registry and selection.

   Which provider runs is decided by env, in this order:
     1. AI_PROVIDER, if set and known
     2. otherwise the first provider in this list whose API key is present

   Model comes from AI_MODEL, or ANTHROPIC_MODEL when running Anthropic (kept
   for backwards compatibility with the original single-provider setup), or the
   provider's default.

   Free-tier providers are listed first so a fresh deployment with only a free
   key configured picks it up without any extra configuration. */

import { anthropic } from './anthropic.js';
import { gemini } from './gemini.js';
import { makeOpenAICompatible } from './openai-compatible.js';

export const groq = makeOpenAICompatible({
  id: 'groq',
  label: 'Groq',
  keyEnv: 'GROQ_API_KEY',
  baseUrl: 'https://api.groq.com/openai/v1',
  defaultModel: 'llama-3.3-70b-versatile',
  freeTier: true,
  keyUrl: 'https://console.groq.com/keys',
});

export const openrouter = makeOpenAICompatible({
  id: 'openrouter',
  label: 'OpenRouter',
  keyEnv: 'OPENROUTER_API_KEY',
  baseUrl: 'https://openrouter.ai/api/v1',
  // OpenRouter model ids move around and ":free" variants come and go —
  // set AI_MODEL to whatever is current rather than trusting this default.
  defaultModel: 'meta-llama/llama-3.3-70b-instruct',
  freeTier: true,
  keyUrl: 'https://openrouter.ai/keys',
  extraHeaders: { 'X-Title': 'WebSyite' },
});

export const openai = makeOpenAICompatible({
  id: 'openai',
  label: 'OpenAI',
  keyEnv: 'OPENAI_API_KEY',
  baseUrl: 'https://api.openai.com/v1',
  defaultModel: 'gpt-4o-mini',
  freeTier: false,
  keyUrl: 'https://platform.openai.com/api-keys',
});

/* Free tiers first — see the note above about auto-detection order. */
export const PROVIDERS = [gemini, groq, openrouter, anthropic, openai];

export const byId = (id) => PROVIDERS.find((p) => p.id === id) || null;

const keyFor = (provider) => process.env[provider.keyEnv] || '';

/** Providers that could actually run right now. */
export function configuredProviders() {
  return PROVIDERS.filter((p) => Boolean(keyFor(p)));
}

/**
 * Resolve the provider to use.
 * @returns {{provider:object|null, model:string, apiKey:string, error:string|null}}
 */
export function resolveProvider() {
  const requestedId = (process.env.AI_PROVIDER || '').trim().toLowerCase();

  if (requestedId) {
    const provider = byId(requestedId);
    if (!provider) {
      return {
        provider: null, model: '', apiKey: '',
        error: `AI_PROVIDER is "${requestedId}", which is not a known provider. Valid values: ${PROVIDERS.map((p) => p.id).join(', ')}.`,
      };
    }
    const apiKey = keyFor(provider);
    if (!apiKey) {
      return {
        provider, model: modelFor(provider), apiKey: '',
        error: `AI_PROVIDER is "${provider.id}" but ${provider.keyEnv} is not set. Get a key at ${provider.keyUrl}.`,
      };
    }
    return { provider, model: modelFor(provider), apiKey, error: null };
  }

  const available = configuredProviders();
  if (!available.length) {
    return {
      provider: null, model: '', apiKey: '',
      error: `No AI provider is configured. Set one of: ${PROVIDERS.map((p) => p.keyEnv).join(', ')}.`,
    };
  }

  const provider = available[0];
  return { provider, model: modelFor(provider), apiKey: keyFor(provider), error: null };
}

function modelFor(provider) {
  if (process.env.AI_MODEL) return process.env.AI_MODEL;
  // The original setup only knew about Anthropic and used ANTHROPIC_MODEL;
  // honour it so existing deployments keep working after this refactor.
  if (provider.id === 'anthropic' && process.env.ANTHROPIC_MODEL) return process.env.ANTHROPIC_MODEL;
  return provider.defaultModel;
}

/** Shape for /api/styles — never includes key values. */
export function providerStatus() {
  const { provider, model, error } = resolveProvider();
  return {
    provider: provider?.id || null,
    providerLabel: provider?.label || null,
    model: model || null,
    freeTier: provider?.freeTier ?? null,
    configured: configuredProviders().map((p) => p.id),
    error,
  };
}
