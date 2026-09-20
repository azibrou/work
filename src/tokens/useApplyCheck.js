import { useMemo } from 'react';

// Dry-runs `validate(data)` (a function that throws on invalid data, e.g. validateCard) so the
// editor can tell up front whether Apply would succeed. Returns { ok, error }.
export function checkApply(validate, data) {
  try {
    validate(data);
    return { ok: true, error: '' };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export function useApplyCheck(validate, data) {
  return useMemo(() => checkApply(validate, data), [validate, data]);
}
