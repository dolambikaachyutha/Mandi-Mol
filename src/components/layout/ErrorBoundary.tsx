import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
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
    console.error('[Mandi Mol ErrorBoundary caught error]:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F6EBD3] flex items-center justify-center p-6 text-[#1B1B3A]">
          <div className="max-w-md w-full bg-white border-[3px] border-[#1B1B3A] rounded-2xl p-6 shadow-2xl text-center">
            <div className="flex justify-center mb-2">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-xl font-black font-display text-[#1B1B3A] mb-1">
              कुछ गड़बड़ हुई (Display Recovery)
            </h2>
            <p className="text-xs text-stone-600 mb-4">
              Mandi Mol encountered a rendering hiccup. We preserved your data safely.
            </p>
            {this.state.error && (
              <pre className="text-[10px] bg-red-50 text-red-900 p-3 rounded-lg border border-red-200 text-left overflow-x-auto mb-4 font-mono">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-2.5 px-4 bg-[#1B1B3A] text-[#F2B705] font-bold text-xs rounded-xl hover:bg-[#2A2A5A] transition-colors shadow inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Mandi Mol
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

