import '@testing-library/jest-dom'
import React from 'react'

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock react-markdown to avoid ES module issues in Jest
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }) {
    return React.createElement('div', { 'data-testid': 'markdown-content' }, children);
  };
});

// Mock remark-gfm
jest.mock('remark-gfm', () => {
  return () => {};
});