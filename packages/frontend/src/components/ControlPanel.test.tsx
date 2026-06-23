import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ControlPanel } from './ControlPanel';

describe('ControlPanel Component', () => {
  it('should render correct title and subtitle in layout mode', () => {
    render(
      <ControlPanel
        roomName="101教室"
        roomId="test-room-123"
        isSeatLocked={false}
        onToggleSeatLock={vi.fn()}
        onClearGrid={vi.fn()}
        onBulkReset={vi.fn()}
        onSaveClassroom={vi.fn()}
        isSaving={false}
        mode="layout"
      />
    );

    expect(screen.getByText('教室設定')).toBeDefined();
    expect(screen.getByText('101教室')).toBeDefined();
    expect(screen.getByText('test-room-123')).toBeDefined();
    
    // Layout mode buttons
    expect(screen.getByText('クリア')).toBeDefined();
    expect(screen.getByText('教室を保存')).toBeDefined();
    expect(screen.queryByText('みんなの回答をクリア')).toBeNull();
  });

  it('should render correct title and subtitle in monitor mode', () => {
    render(
      <ControlPanel
        roomName="101教室"
        roomId="test-room-123"
        isSeatLocked={false}
        onToggleSeatLock={vi.fn()}
        onClearGrid={vi.fn()}
        onBulkReset={vi.fn()}
        onSaveClassroom={vi.fn()}
        isSaving={false}
        mode="monitor"
      />
    );

    expect(screen.getByText('みんなの様子')).toBeDefined();
    
    // Monitor mode buttons
    expect(screen.getByText('みんなの回答をクリア')).toBeDefined();
    expect(screen.queryByText('クリア')).toBeNull();
    expect(screen.queryByText('教室を保存')).toBeNull();
  });

  it('should display saving state when isSaving is true', () => {
    render(
      <ControlPanel
        roomName="101教室"
        roomId="test-room-123"
        isSeatLocked={false}
        onToggleSeatLock={vi.fn()}
        onClearGrid={vi.fn()}
        onBulkReset={vi.fn()}
        onSaveClassroom={vi.fn()}
        isSaving={true}
        mode="layout"
      />
    );

    const saveButton = screen.getByText('保存中...');
    expect(saveButton).toBeDefined();
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('should call callbacks on button click', () => {
    const onClearGrid = vi.fn();
    const onSaveClassroom = vi.fn();

    render(
      <ControlPanel
        roomName="101教室"
        roomId="test-room-123"
        isSeatLocked={false}
        onToggleSeatLock={vi.fn()}
        onClearGrid={onClearGrid}
        onBulkReset={vi.fn()}
        onSaveClassroom={onSaveClassroom}
        isSaving={false}
        mode="layout"
      />
    );

    fireEvent.click(screen.getByText('クリア'));
    expect(onClearGrid).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('教室を保存'));
    expect(onSaveClassroom).toHaveBeenCalledTimes(1);
  });
});
