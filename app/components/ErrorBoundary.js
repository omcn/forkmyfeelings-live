"use client";
import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6 max-w-sm">
            Rascal hit a bump. Try refreshing the page.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition"
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-6 text-left text-xs text-red-600 bg-red-50 p-4 rounded-xl max-w-lg overflow-auto">
              {this.state.error.toString()}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
