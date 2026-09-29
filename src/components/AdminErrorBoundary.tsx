'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AdminErrorBoundary caught error]:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-white border border-red-200 shadow-sm max-w-xl mx-auto my-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#021526]">
              {this.props.fallbackTitle || 'Unable to load dashboard section'}
            </h3>
            <p className="text-xs text-[#5F6368]">
              {this.props.fallbackMessage ||
                'A temporary rendering exception occurred. You can reload this view to retry.'}
            </p>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-left overflow-auto max-h-36">
              <p className="text-[11px] font-mono text-red-600 font-bold">
                {this.state.error.name}: {this.state.error.message}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={this.handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F94001] hover:bg-[#D93600] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Section</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
