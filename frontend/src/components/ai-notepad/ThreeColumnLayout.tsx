/**
 * 三栏布局组件
 * 响应式设计，支持拖拽调整宽度
 */

'use client';

import { useState, useRef, useEffect } from 'react';

interface ThreeColumnLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
}

export function ThreeColumnLayout({
  leftPanel,
  centerPanel,
  rightPanel,
}: ThreeColumnLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(300);
  const [rightWidth, setRightWidth] = useState(320);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const MIN_WIDTH = 250;
  const MAX_WIDTH = 500;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();

      if (isDraggingLeft) {
        const newWidth = e.clientX - containerRect.left;
        setLeftWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
      }

      if (isDraggingRight) {
        const newWidth = containerRect.right - e.clientX;
        setRightWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
    };

    if (isDraggingLeft || isDraggingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDraggingLeft, isDraggingRight]);

  const handleLeftMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
  };

  const handleRightMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
  };

  return (
    <div
      ref={containerRef}
      className="flex h-full bg-gray-100"
    >
      {/* 左侧面板 */}
      <div
        ref={leftRef}
        className="bg-white shadow-sm border-r"
        style={{ width: leftWidth, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH }}
      >
        {leftPanel}
      </div>

      {/* 左侧拖拽条 */}
      <div
        className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors"
        onMouseDown={handleLeftMouseDown}
        style={{ cursor: 'col-resize' }}
      >
        <div className="w-full h-full hover:bg-blue-500 transition-colors"></div>
      </div>

      {/* 中间面板 */}
      <div className="flex-1 min-w-0">
        {centerPanel}
      </div>

      {/* 右侧拖拽条 */}
      <div
        className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors"
        onMouseDown={handleRightMouseDown}
        style={{ cursor: 'col-resize' }}
      >
        <div className="w-full h-full hover:bg-blue-500 transition-colors"></div>
      </div>

      {/* 右侧面板 */}
      <div
        ref={rightRef}
        className="bg-white shadow-sm border-l"
        style={{ width: rightWidth, minWidth: MIN_WIDTH, maxWidth: MAX_WIDTH }}
      >
        {rightPanel}
      </div>
    </div>
  );
}