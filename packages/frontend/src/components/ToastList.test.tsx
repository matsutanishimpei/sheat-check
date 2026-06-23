// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { ToastList, ToastMessage } from './ToastList';

describe('ToastList Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render multiple toast messages with correct text and style classes', () => {
    const mockToasts: ToastMessage[] = [
      { id: '1', type: 'success', message: '操作が完了しました' },
      { id: '2', type: 'error', message: 'エラーが発生しました' },
      { id: '3', type: 'warning', message: '警告があります' },
      { id: '4', type: 'info', message: '情報メッセージです' },
    ];

    render(<ToastList toasts={mockToasts} />);

    // Verify all messages are in the document
    expect(screen.getByText('操作が完了しました')).toBeDefined();
    expect(screen.getByText('エラーが発生しました')).toBeDefined();
    expect(screen.getByText('警告があります')).toBeDefined();
    expect(screen.getByText('情報メッセージです')).toBeDefined();

    // Verify classes are applied correctly
    const successToast = screen.getByText('操作が完了しました').closest('.toast');
    expect(successToast?.className).toContain('toast');
    expect(successToast?.className).toContain('success');

    const errorToast = screen.getByText('エラーが発生しました').closest('.toast');
    expect(errorToast?.className).toContain('toast');
    expect(errorToast?.className).toContain('error');
  });

  it('should render empty container when toasts list is empty', () => {
    const { container } = render(<ToastList toasts={[]} />);
    const containerDiv = container.querySelector('.toast-container');
    expect(containerDiv).toBeDefined();
    expect(containerDiv?.children.length).toBe(0);
  });
});
