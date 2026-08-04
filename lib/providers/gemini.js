/* Google Gemini adapter.

   Gemini does not speak the OpenAI protocol, so it needs its own reader.
   The key goes in the x-goog-api-key header rather than the query string —
   Gemini accepts both, but a key in a URL ends up in logs and proxies. */

import { sseData, errorText } from './sse.js';

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const gemini = {
  id: 'gemini',
  label: 'Google Gemini',
  keyEnv: 'GEMINI_API_KEY',
  defaultModel: 'gemini-2.0-flash',
  freeTier: true,
  keyUrl: 'https://aistudio.google.com/apikey',

  async stream({ prompt, model, maxTokens, apiKey, onChunk }) {
    const res = await fetch(`${BASE}/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 1 },
      }),
    });

    if (!res.ok) throw new Error(await errorText(res));

    let full = '';
    for await (const payload of sseData(res)) {
      let json;
      try { json = JSON.parse(payload); } catch { continue; }

      if (json.error) throw new Error(JSON.stringify(json.error).slice(0, 400));

      // A candidate can carry several parts; concatenate them all.
      const parts = json.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (typeof part.text === 'string' && part.text) {
          full += part.text;
          onChunk?.(part.text);
        }
      }
    }

    return full;
  },
};
