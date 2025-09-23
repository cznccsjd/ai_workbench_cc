/**
 * 客户端TextEncoder初始化组件
 */

'use client';

import { useEffect } from 'react';
import { initializeTextEncoderPolyfill } from '@/lib/utils/textEncoder';

export default function TextEncoderInit() {
  useEffect(() => {
    // 在客户端初始化polyfill
    initializeTextEncoderPolyfill();
  }, []);

  return null;
}