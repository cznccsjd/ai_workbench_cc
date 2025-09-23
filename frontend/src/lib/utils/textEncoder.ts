/**
 * TextEncoder/TextDecoder polyfill and utility functions
 * 解决Node.js环境和某些浏览器中TextEncoder/TextDecoder不可用的问题
 */

// 检查是否支持TextEncoder/TextDecoder
const hasTextEncoder = typeof TextEncoder !== 'undefined';
const hasTextDecoder = typeof TextDecoder !== 'undefined';

/**
 * TextEncoder polyfill
 */
class TextEncoderPolyfill {
  encode(input: string): Uint8Array {
    const bytes: number[] = [];
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      if (char < 0x80) {
        bytes.push(char);
      } else if (char < 0x800) {
        bytes.push(0xc0 | (char >> 6));
        bytes.push(0x80 | (char & 0x3f));
      } else if (char < 0xd800 || char >= 0xe000) {
        bytes.push(0xe0 | (char >> 12));
        bytes.push(0x80 | ((char >> 6) & 0x3f));
        bytes.push(0x80 | (char & 0x3f));
      } else {
        // Surrogate pair
        i++;
        const char2 = input.charCodeAt(i);
        const codePoint = 0x10000 + (((char & 0x3ff) << 10) | (char2 & 0x3ff));
        bytes.push(0xf0 | (codePoint >> 18));
        bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
        bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
        bytes.push(0x80 | (codePoint & 0x3f));
      }
    }
    return new Uint8Array(bytes);
  }
}

/**
 * TextDecoder polyfill
 */
class TextDecoderPolyfill {
  decode(input: Uint8Array, options?: { stream?: boolean }): string {
    let result = '';
    let i = 0;

    while (i < input.length) {
      let byte1 = input[i++];

      if (byte1 < 0x80) {
        // 1-byte character
        result += String.fromCharCode(byte1);
      } else if ((byte1 >> 5) === 0x06) {
        // 2-byte character
        const byte2 = input[i++];
        result += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
      } else if ((byte1 >> 4) === 0x0e) {
        // 3-byte character
        const byte2 = input[i++];
        const byte3 = input[i++];
        result += String.fromCharCode(((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f));
      } else if ((byte1 >> 3) === 0x1e) {
        // 4-byte character
        const byte2 = input[i++];
        const byte3 = input[i++];
        const byte4 = input[i++];
        const codePoint = ((byte1 & 0x07) << 18) | ((byte2 & 0x3f) << 12) | ((byte3 & 0x3f) << 6) | (byte4 & 0x3f);

        if (codePoint > 0xffff) {
          // Convert to surrogate pair
          const high = 0xd800 + ((codePoint - 0x10000) >> 10);
          const low = 0xdc00 + ((codePoint - 0x10000) & 0x3ff);
          result += String.fromCharCode(high, low);
        } else {
          result += String.fromCharCode(codePoint);
        }
      }
    }

    return result;
  }
}

/**
 * 获取可用的TextEncoder实例
 */
export const getTextEncoder = (): TextEncoderPolyfill | TextEncoder => {
  if (hasTextEncoder) {
    return new TextEncoder();
  }
  return new TextEncoderPolyfill();
};

/**
 * 获取可用的TextDecoder实例
 */
export const getTextDecoder = (): TextDecoderPolyfill | TextDecoder => {
  if (hasTextDecoder) {
    return new TextDecoder();
  }
  return new TextDecoderPolyfill();
};

/**
 * 安全的文本编码函数
 */
export const encodeText = (text: string): Uint8Array => {
  const encoder = getTextEncoder();
  return encoder.encode(text);
};

/**
 * 安全的文本解码函数
 */
export const decodeText = (data: Uint8Array, options?: { stream?: boolean }): string => {
  const decoder = getTextDecoder();
  return decoder.decode(data, options);
};

/**
 * 检查当前环境是否支持原生TextEncoder/TextDecoder
 */
export const hasNativeTextEncoderSupport = (): boolean => {
  return hasTextEncoder && hasTextDecoder;
};

/**
 * 初始化全局polyfill（如果需要）
 */
export const initializeTextEncoderPolyfill = (): void => {
  if (typeof global !== 'undefined') {
    // Node.js环境
    if (!global.TextEncoder) {
      global.TextEncoder = TextEncoderPolyfill as any;
    }
    if (!global.TextDecoder) {
      global.TextDecoder = TextDecoderPolyfill as any;
    }
  }

  if (typeof window !== 'undefined') {
    // 浏览器环境
    if (!window.TextEncoder) {
      (window as any).TextEncoder = TextEncoderPolyfill;
    }
    if (!window.TextDecoder) {
      (window as any).TextDecoder = TextDecoderPolyfill;
    }
  }
};