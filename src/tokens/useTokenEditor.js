import { useState } from 'react';

export async function postJson(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 404) {
    throw new Error('the save endpoint is missing. Stop Storybook (Ctrl+C) and start it again with npm run storybook.');
  }
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

// `send(data)` performs the save. It may return { data } to replace the editor state with what the server stored.
export function useApplyEditor(initial, send) {
  const [data, setData] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const dirty = JSON.stringify(data) !== JSON.stringify(saved);

  async function apply() {
    setStatus({ state: 'saving', message: 'Applying...' });
    try {
      const result = await send(data);
      const next = result?.data ?? data;
      setData(next);
      setSaved(next);
      setStatus({ state: 'saved', message: 'Applied. Project files updated.' });
    } catch (error) {
      setStatus({ state: 'error', message: `Not applied: ${error.message}` });
    }
  }

  function reset() {
    setData(saved);
    setStatus({ state: 'idle', message: '' });
  }

  return { data, setData, dirty, apply, reset, status };
}

export function useTokenEditor(category, initial) {
  return useApplyEditor(initial, (data) => postJson('/__tokens/save', { category, data }));
}
