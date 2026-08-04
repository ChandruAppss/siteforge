/* Factory for any provider speaking the OpenAI chat-completions protocol.
   Groq, OpenRouter and OpenAI itself all do, so one implementation covers
   three of the five providers. */

import { sseData, errorText } from './sse.js';

export function makeOpenAICompatible(config) {
  const { baseUrl, extraHeaders } = config;

  return {
    ...config,

    async stream({ prompt, model, maxTokens, apiKey, onChunk }) {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...(extraHeaders || {}),
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature: 1,
          stream: true,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) throw new Error(await errorText(res));

      let full = '';
      for await (const payload of sseData(res)) {
        let json;
        try { json = JSON.parse(payload); } catch { continue; }

        // Some gateways report errors mid-stream rather than via status code.
        if (json.error) throw new Error(JSON.stringify(json.error).slice(0, 400));

        const delta = json.choices?.[0]?.delta?.content;
        if (delta) { full += delta; onChunk?.(delta); }
      }

      return full;
    },
  };
}
