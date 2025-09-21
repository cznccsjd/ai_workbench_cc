/**
 * useAIStream Hook 测试
 */

import { renderHook, act } from '@testing-library/react';
import { useAIStream, useSimpleAIStream } from '../useAIStream';

// Mock fetch
global.fetch = jest.fn();

// Mock AbortController
const mockAbort = jest.fn();
global.AbortController = jest.fn(() => ({
  signal: { aborted: false },
  abort: mockAbort,
})) as any;

describe('useAIStream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"content":"Hello"}\n\n') })
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"content":" World"}\n\n') })
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]\n\n') })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    });
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAIStream());

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.startStreaming).toBe('function');
    expect(typeof result.current.stopStreaming).toBe('function');
  });

  it('should handle successful streaming', async () => {
    const { result } = renderHook(() => useAIStream());
    const onChunk = jest.fn();
    const onComplete = jest.fn();

    await act(async () => {
      await result.current.startStreaming('Test message', {
        onChunk,
        onComplete,
      });
    });

    expect(result.current.isStreaming).toBe(false);
    expect(onChunk).toHaveBeenCalledWith('Hello');
    expect(onChunk).toHaveBeenCalledWith(' World');
    expect(onComplete).toHaveBeenCalledWith('Hello World');
  });

  it('should handle streaming errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useAIStream());
    const onError = jest.fn();

    await act(async () => {
      await result.current.startStreaming('Test message', {
        onError,
      });
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(onError).toHaveBeenCalled();
  });

  it('should handle abort streaming', async () => {
    const { result } = renderHook(() => useAIStream());

    act(() => {
      result.current.startStreaming('Test message');
    });

    expect(result.current.isStreaming).toBe(true);

    act(() => {
      result.current.stopStreaming();
    });

    expect(mockAbort).toHaveBeenCalled();
  });

  it('should handle network errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAIStream());
    const onError = jest.fn();

    await act(async () => {
      await result.current.startStreaming('Test message', {
        onError,
      });
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain('Network error');
  });
});

describe('useSimpleAIStream', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"content":"Test"}\n\n') })
            .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: [DONE]\n\n') })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    });
  });

  it('should provide simplified streaming interface', async () => {
    const { result } = renderHook(() => useSimpleAIStream());

    expect(result.current.streamingContent).toBe('');
    expect(result.current.isStreaming).toBe(false);
    expect(typeof result.current.streamMessage).toBe('function');
  });

  it('should update streaming content during streaming', async () => {
    const { result } = renderHook(() => useSimpleAIStream());

    await act(async () => {
      await result.current.streamMessage('Test message');
    });

    expect(result.current.streamingContent).toBe('Test');
    expect(result.current.isStreaming).toBe(false);
  });

  it('should handle streaming errors in simple mode', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Stream error'));

    const { result } = renderHook(() => useSimpleAIStream());

    await act(async () => {
      await result.current.streamMessage('Test message');
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});