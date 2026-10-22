import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/** A copy of the params with one key set, or removed when the value is empty. */
export function withParam(prev: URLSearchParams, key: string, value: string | null): URLSearchParams {
  const p = new URLSearchParams(prev);
  if (value) p.set(key, value);
  else p.delete(key);
  return p;
}

/**
 * Read and update URL search params without losing quick successive changes.
 * React Router's own setter starts from the params of the last render, so a chip click
 * followed at once by typing could undo the click. This keeps the latest params in a ref.
 */
export function useUrlParams() {
  const [params, setParams] = useSearchParams();
  const latest = useRef(params);
  useEffect(() => {
    latest.current = params;
  }, [params]);

  const replace = (next: URLSearchParams) => {
    latest.current = next;
    setParams(next, { replace: true });
  };
  const setParam = (key: string, value: string | null) => replace(withParam(latest.current, key, value));
  const clearParams = () => replace(new URLSearchParams());
  return { params, setParam, clearParams };
}

/**
 * Text for a search box mirrored to one URL param. The box keeps its own text, so fast typing
 * is never lost while the URL catches up, and it follows the URL when the URL changes to
 * something the box didn't write (a nav link, "Clear filters", Back).
 */
export function useUrlText(params: URLSearchParams, setParam: (key: string, value: string | null) => void, key: string) {
  const fromUrl = params.get(key) ?? '';
  const [state, setState] = useState({ text: fromUrl, seenUrl: fromUrl, written: [] as string[] });
  if (fromUrl !== state.seenUrl) {
    const ours = state.written.includes(fromUrl);
    const caughtUp = fromUrl === state.text;
    setState({ text: ours ? state.text : fromUrl, seenUrl: fromUrl, written: ours && !caughtUp ? state.written : [] });
  }
  const setText = (next: string) => {
    setState((s) => ({ ...s, text: next, written: [...s.written, next] }));
    setParam(key, next);
  };
  return [state.text, setText] as const;
}
