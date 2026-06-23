import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '2rem',
          margin: '2rem auto',
          maxWidth: '600px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '12px',
          color: '#ef4444',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h2 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: 600 }}>想定外のエラーが発生しました</h2>
          <p style={{ color: 'var(--text-muted, #666)', fontSize: '0.95rem', margin: '0.5rem 0 1.5rem' }}>
            アプリケーションの実行中に予期しない問題が発生したため、この部分の表示を停止しました。
          </p>
          <pre style={{
            background: 'rgba(0,0,0,0.05)',
            padding: '1rem',
            borderRadius: '6px',
            overflowX: 'auto',
            fontSize: '0.85rem',
            color: '#333'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '0.6rem 1.2rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9rem',
              marginTop: '1rem'
            }}
          >
            ページを再読み込みする
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
