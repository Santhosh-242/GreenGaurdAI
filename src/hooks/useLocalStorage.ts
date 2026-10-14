import { useCallback, useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed = JSON.parse(raw);
      // Merge with initial defaults so new fields get populated
      if (
        initial &&
        typeof initial === 'object' &&
        !Array.isArray(initial) &&
        parsed &&
        typeof parsed === 'object'
      ) {
        return { ...initial, ...parsed };
      }
      return parsed as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable */
    }
  }, [key, value]);

  const update = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValue((prev) =>
        typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater,
      );
    },
    [],
  );

  return [value, update] as const;
}
