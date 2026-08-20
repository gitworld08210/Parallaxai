import React from "react";
import { AlertTriangle } from "lucide-react";
import { reportError } from "@/lib/errorReporting";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  userId?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private static globalUserId: string | undefined;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /** Set a global user ID for error reporting when prop-based passing is not convenient. */
  static setUserId(userId: string | undefined): void {
    ErrorBoundary.globalUserId = userId;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    const userId = this.props.userId || ErrorBoundary.globalUserId;
    reportError(error, {
      userId,
      extra: { componentStack: errorInfo.componentStack || undefined },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
          <div className="flex flex-col items-center gap-6 max-w-sm">
            <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>

            <h1 className="text-2xl font-bold text-white">Something went wrong</h1>

            {this.state.error && (
              <p className="text-zinc-400 text-sm break-words">
                {this.state.error.message}
              </p>
            )}

            <div className="flex flex-col gap-3 w-full mt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-colors border border-white/10"
              >
                Try Again
              </button>
              <a
                href="/"
                className="w-full px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-medium transition-colors border border-white/5 inline-block"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
