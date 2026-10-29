import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-10 my-4 max-w-2xl mx-auto bg-white rounded-3xl border border-rose-200 shadow-xl space-y-5 text-center font-geist">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
            <AlertOctagon className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900">
              {this.props.fallbackTitle || 'Terjadi Kendala Memuat Tampilan'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-lg mx-auto">
              Sistem mendeteksi format data lokal yang tidak sesuai. Halaman tidak dapat dimuat sementara. Silakan segarkan komponen di bawah ini.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left font-mono text-[11px] text-rose-800 break-all max-h-32 overflow-y-auto">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Muat Ulang Halaman</span>
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('ampelgading_cbt_users');
                window.location.reload();
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <span>Pulihkan Data Default & Refresh</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
