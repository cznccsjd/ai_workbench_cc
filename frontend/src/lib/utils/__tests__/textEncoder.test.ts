/**
 * TextEncoder Polyfill 测试
 */

import {
  getTextEncoder,
  getTextDecoder,
  encodeText,
  decodeText,
  hasNativeTextEncoderSupport,
  initializeTextEncoderPolyfill
} from '@/lib/utils/textEncoder';

describe('TextEncoder Polyfill', () => {
  beforeEach(() => {
    // 重置环境
    jest.clearAllMocks();
  });

  describe('getTextEncoder', () => {
    it('should return a TextEncoder instance', () => {
      const encoder = getTextEncoder();
      expect(encoder).toBeDefined();
      expect(typeof encoder.encode).toBe('function');
    });

    it('should encode simple ASCII text correctly', () => {
      const encoder = getTextEncoder();
      const result = encoder.encode('Hello');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
    });

    it('should encode UTF-8 text correctly', () => {
      const encoder = getTextEncoder();
      const result = encoder.encode('你好');
      expect(result).toBeInstanceOf(Uint8Array);
      // UTF-8 encoding for '你好'
      expect(result.length).toBeGreaterThan(2); // Should be more than 2 bytes for Chinese characters
    });

    it('should encode empty string', () => {
      const encoder = getTextEncoder();
      const result = encoder.encode('');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(0);
    });
  });

  describe('getTextDecoder', () => {
    it('should return a TextDecoder instance', () => {
      const decoder = getTextDecoder();
      expect(decoder).toBeDefined();
      expect(typeof decoder.decode).toBe('function');
    });

    it('should decode simple ASCII text correctly', () => {
      const decoder = getTextDecoder();
      const input = new Uint8Array([72, 101, 108, 108, 111]);
      const result = decoder.decode(input);
      expect(result).toBe('Hello');
    });

    it('should decode empty array', () => {
      const decoder = getTextDecoder();
      const input = new Uint8Array([]);
      const result = decoder.decode(input);
      expect(result).toBe('');
    });

    it('should handle streaming option', () => {
      const decoder = getTextDecoder();
      const input = new Uint8Array([72, 101, 108, 108, 111]);
      const result = decoder.decode(input, { stream: true });
      expect(result).toBe('Hello');
    });
  });

  describe('encodeText and decodeText', () => {
    it('should encode and decode text correctly', () => {
      const originalText = 'Hello World! 你好世界！';
      const encoded = encodeText(originalText);
      const decoded = decodeText(encoded);

      expect(encoded).toBeInstanceOf(Uint8Array);
      expect(decoded).toBe(originalText);
    });

    it('should handle special characters', () => {
      const specialText = '🚀 测试 emoji 🎉';
      const encoded = encodeText(specialText);
      const decoded = decodeText(encoded);

      expect(decoded).toBe(specialText);
    });

    it('should handle newlines and whitespace', () => {
      const textWithNewlines = 'Line 1\nLine 2\r\nLine 3\t\tTabbed';
      const encoded = encodeText(textWithNewlines);
      const decoded = decodeText(encoded);

      expect(decoded).toBe(textWithNewlines);
    });
  });

  describe('hasNativeTextEncoderSupport', () => {
    it('should return a boolean', () => {
      const hasSupport = hasNativeTextEncoderSupport();
      expect(typeof hasSupport).toBe('boolean');
    });
  });

  describe('initializeTextEncoderPolyfill', () => {
    it('should initialize polyfill without throwing', () => {
      expect(() => {
        initializeTextEncoderPolyfill();
      }).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long strings', () => {
      const longString = 'A'.repeat(10000);
      const encoded = encodeText(longString);
      const decoded = decodeText(encoded);

      expect(decoded).toBe(longString);
      expect(encoded.length).toBe(10000); // ASCII characters are 1 byte each
    });

    it('should handle mixed character sets', () => {
      const mixedText = 'English 中文 العربية русский 日本語 🌍';
      const encoded = encodeText(mixedText);
      const decoded = decodeText(encoded);

      expect(decoded).toBe(mixedText);
    });

    it('should handle control characters', () => {
      const controlText = 'Before\x00\x01\x02After';
      const encoded = encodeText(controlText);
      const decoded = decodeText(encoded);

      expect(decoded).toBe(controlText);
    });
  });

  describe('Streaming response simulation', () => {
    it('should handle streaming data chunks like useAIStream', () => {
      const encoder = getTextEncoder();
      const decoder = getTextDecoder();

      // Simulate streaming chunks
      const chunks = [
        'data: {"content":"Hello"}\n\n',
        'data: {"content":" World"}\n\n',
        'data: [DONE]\n\n'
      ];

      let fullResponse = '';
      chunks.forEach(chunk => {
        const encoded = encoder.encode(chunk);
        const decoded = decoder.decode(encoded, { stream: true });
        expect(decoded).toBe(chunk);

        // Simulate parsing streaming data
        const lines = decoded.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      });

      expect(fullResponse).toBe('Hello World');
    });

    it('should handle Chinese characters in streaming', () => {
      const encoder = getTextEncoder();
      const decoder = getTextDecoder();

      const chineseChunk = 'data: {"content":"你好世界"}\n\n';
      const encoded = encoder.encode(chineseChunk);
      const decoded = decoder.decode(encoded);

      expect(decoded).toBe(chineseChunk);

      // Parse the JSON content
      const lines = decoded.split('\n');
      const dataLine = lines.find(line => line.startsWith('data: '));
      if (dataLine) {
        const jsonData = dataLine.slice(6);
        const parsed = JSON.parse(jsonData);
        expect(parsed.content).toBe('你好世界');
      }
    });
  });

  describe('Browser environment compatibility', () => {
    it('should work in both browser and Node.js environments', () => {
      // This test ensures our polyfill works across environments
      const encoder = getTextEncoder();
      const decoder = getTextDecoder();

      const testText = 'Cross-environment test 跨环境测试';
      const encoded = encoder.encode(testText);
      const decoded = decoder.decode(encoded);

      expect(decoded).toBe(testText);
    });
  });
});