// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary Component', () => {
  let consoleSpy: any;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  const ProblematicComponent = () => {
    throw new Error('Test rendering error');
  };

  it('should render children normally if no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>正常なコンポーネント</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('正常なコンポーネント')).toBeDefined();
  });

  it('should render default fallback UI when a child component crashes', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('想定外のエラーが発生しました')).toBeDefined();
    expect(screen.getByText(/Test rendering error/)).toBeDefined();
  });

  it('should render custom fallback UI when provided', () => {
    const { queryByText, getByText } = render(
      <ErrorBoundary fallback={<div>カスタムエラーUI</div>}>
        <ProblematicComponent />
      </ErrorBoundary>
    );

    expect(getByText('カスタムエラーUI')).toBeDefined();
    expect(queryByText('想定外のエラーが発生しました')).toBeNull();
  });
});
