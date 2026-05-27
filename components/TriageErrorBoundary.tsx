"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  resetLabel?: string;
};

type State = { error: Error | null };

export class TriageErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[TriageErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-4 my-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-lg font-semibold text-red-800 dark:text-red-300">Something went wrong</p>
          <p className="mt-2 text-sm text-red-700/80 dark:text-red-200/70">
            The triage form encountered an error. Please refresh the page or try again.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="btn-touch mt-4 rounded-xl bg-red-600 px-6 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            {this.props.resetLabel ?? "Try again"}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
