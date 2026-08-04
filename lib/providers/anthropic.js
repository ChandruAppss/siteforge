/* Anthropic adapter — uses the official SDK, which is already a dependency. */

import Anthropic from '@anthropic-ai/sdk';

let cached = null;
let cachedKey = null;

export const anthropic = {
  id: 'anthropic',
  label: 'Anthropic (Claude)',
  keyEnv: 'ANTHROPIC_API_KEY',
  defaultModel: 'claude-sonnet-5',
  freeTier: false,
  keyUrl: 'https://console.anthropic.com/settings/keys',

  async stream({ prompt, model, maxTokens, apiKey, onChunk }) {
    if (!cached || cachedKey !== apiKey) {
      cached = new Anthropic({ apiKey });
      cachedKey = apiKey;
    }

    let full = '';

    const stream = cached.messages.stream({
      model,
      max_tokens: maxTokens,
      temperature: 1,
      messages: [{ role: 'user', content: prompt }],
    });

    stream.on('text', (text) => {
      full += text;
      onChunk?.(text);
    });

    await stream.finalMessage();
    return full;
  },
};
