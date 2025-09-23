/**
 * AI聊天API路由 - 流式响应
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 模拟流式响应（实际项目中应该连接到后端流式API）
          const response = await fetch(`${BACKEND_URL}/api/chat/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: body.message,
              conversation_id: body.conversation_id || `conv_${Date.now()}`,
              model: body.model || 'kimi-moonshot-v1-8k',
              stream: true,
              temperature: body.temperature || 0.7,
              max_tokens: body.max_tokens || 2000,
            }),
          });

          if (!response.ok) {
            // 发送错误响应
            const errorData = JSON.stringify({
              content: '',
              isComplete: true,
              error: `Backend error: ${response.status}`
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }

          // 检查后端是否支持流式响应
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            // 后端返回的是普通JSON响应，我们需要模拟流式响应
            const data = await response.json();
            const content = data.content || data.response || '';

            // 将响应分块发送
            const words = content.split(' ');
            for (let i = 0; i < words.length; i++) {
              const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
              const chunkData = JSON.stringify({
                content: chunk,
                isComplete: false
              });
              controller.enqueue(encoder.encode(`data: ${chunkData}\n\n`));

              // 添加延迟模拟打字效果
              await new Promise(resolve => setTimeout(resolve, 50));
            }

            // 发送完成信号
            const completeData = JSON.stringify({
              content: '',
              isComplete: true
            });
            controller.enqueue(encoder.encode(`data: ${completeData}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));

          } else if (response.body) {
            // 后端支持流式响应，直接转发
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              controller.enqueue(encoder.encode(chunk));
            }
          } else {
            // 后端不支持流式响应，发送错误
            const errorData = JSON.stringify({
              content: '',
              isComplete: true,
              error: 'Backend does not support streaming'
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          }

          controller.close();

        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = JSON.stringify({
            content: '',
            isComplete: true,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Stream API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}