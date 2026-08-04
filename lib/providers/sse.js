/* Minimal Server-Sent Events reader.
 *
 * Every provider here streams over SSE, but chunk boundaries from fetch do not
 * line up with event boundaries — a single read can end mid-line. This buffers
 * until it has whole lines and yields only the `data:` payloads.
 */

export async function* sseData(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);

      if (!line || line.startsWith(':')) continue;      // comment / keep-alive
      if (!line.startsWith('data:')) continue;

      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return;
      yield payload;
    }
  }
}

/** Read an error body without letting a huge HTML error page into the log. */
export async function errorText(res) {
  let body = '';
  try { body = await res.text(); } catch { /* ignore */ }
  return `${res.status} ${body}`.slice(0, 600);
}
