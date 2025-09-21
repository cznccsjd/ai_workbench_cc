/**
 * AI流式响应Hook
 */

import { useState, useCallback, useRef } from 'react';
import { Message } from '@/types/ai';

interface StreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

interface UseAIStreamReturn {
  isStreaming: boolean;
  error: Error | null;
  startStreaming: (message: string, options?: StreamOptions) => Promise<void>;
  stopStreaming: () => void;
}

export function useAIStream(): UseAIStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStreaming = useCallback(async (message: string, options?: StreamOptions) => {
    try {
      setIsStreaming(true);
      setError(null);

      // 创建新的AbortController
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not available');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              options?.onComplete?.(fullResponse);
              setIsStreaming(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.content || '';

              if (content) {
                fullResponse += content;
                options?.onChunk?.(content);
              }

              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // 忽略解析错误，继续处理下一行
              console.warn('Failed to parse streaming data:', e);
            }
          }
        }
      }

      options?.onComplete?.(fullResponse);
      setIsStreaming(false);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Streaming was aborted');
      } else {
        console.error('Streaming error:', error);
        setError(error instanceof Error ? error : new Error('Unknown error'));
        options?.onError?.(error instanceof Error ? error : new Error('Unknown error'));
      }
      setIsStreaming(false);
    }
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    error,
    startStreaming,
    stopStreaming,
  };
}

/**
 * 简化版的流式响应Hook，用于组件内部
 */
export function useSimpleAIStream() {
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const { startStreaming, stopStreaming, error } = useAIStream();

  const streamMessage = useCallback(async (message: string) => {
    setStreamingContent('');
    setIsStreaming(true);

    await startStreaming(message, {
      onChunk: (chunk) => {
        setStreamingContent(prev => prev + chunk);
      },
      onComplete: () => {
        setIsStreaming(false);
      },
      onError: (error) => {
        console.error('Stream error:', error);
        setIsStreaming(false);
      },
    });
  }, [startStreaming]);

  return {
    streamingContent,
    isStreaming,
    streamMessage,
    stopStreaming,
    error,
  };
}