/**
 * Debounce自定义hook
 * 用于延迟执行频繁触发的操作
 */

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函数
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}