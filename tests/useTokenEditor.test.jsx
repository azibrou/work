// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTokenEditor } from '../src/tokens/useTokenEditor.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function renderHook(hook) {
  const result = { current: null };
  const root = createRoot(document.createElement('div'));
  function Probe() {
    result.current = hook();
    return null;
  }
  act(() => root.render(createElement(Probe)));
  return result;
}

const response = (ok, body, status = ok ? 200 : 500) => ({ ok, status, json: async () => body });

describe('useTokenEditor', () => {
  let fetchMock;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const edited = (category = 'color') => {
    const result = renderHook(() => useTokenEditor(category, { a: 1 }));
    act(() => result.current.setData({ a: 2 }));
    return result;
  };

  it('starts clean and idle', () => {
    const result = renderHook(() => useTokenEditor('color', { a: 1 }));
    expect(result.current.data).toEqual({ a: 1 });
    expect(result.current.dirty).toBe(false);
    expect(result.current.status).toEqual({ state: 'idle', message: '' });
  });

  it('becomes dirty when data changes and clean again when reverted', () => {
    const result = edited();
    expect(result.current.dirty).toBe(true);
    act(() => result.current.setData({ a: 1 }));
    expect(result.current.dirty).toBe(false);
  });

  it('reset restores the saved data', () => {
    const result = edited();
    act(() => result.current.reset());
    expect(result.current.data).toEqual({ a: 1 });
    expect(result.current.dirty).toBe(false);
  });

  it('apply posts the category and data, then marks the data as saved', async () => {
    fetchMock.mockResolvedValue(response(true, {}));
    const result = edited('animation');
    await act(() => result.current.apply());

    expect(fetchMock).toHaveBeenCalledWith('/__tokens/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'animation', data: { a: 2 } }),
    });
    expect(result.current.dirty).toBe(false);
    expect(result.current.status.state).toBe('saved');
  });

  it('reset after a successful apply keeps the applied data', async () => {
    fetchMock.mockResolvedValue(response(true, {}));
    const result = edited();
    await act(() => result.current.apply());
    act(() => result.current.reset());
    expect(result.current.data).toEqual({ a: 2 });
  });

  it('reports the server error and stays dirty', async () => {
    fetchMock.mockResolvedValue(response(false, { error: 'duration: bad' }));
    const result = edited('animation');
    await act(() => result.current.apply());

    expect(result.current.dirty).toBe(true);
    expect(result.current.status).toEqual({ state: 'error', message: 'Not applied: duration: bad' });
  });

  it('explains a missing save endpoint on 404', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404, json: () => Promise.reject(new Error('no json')) });
    const result = edited();
    await act(() => result.current.apply());
    expect(result.current.status.state).toBe('error');
    expect(result.current.status.message).toContain('save endpoint is missing');
  });

  it('falls back to the status code when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 502, json: () => Promise.reject(new Error('no json')) });
    const result = edited();
    await act(() => result.current.apply());
    expect(result.current.status.message).toBe('Not applied: Request failed (502)');
  });

  it('reports network failures', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const result = edited();
    await act(() => result.current.apply());
    expect(result.current.status).toEqual({ state: 'error', message: 'Not applied: offline' });
  });
});
