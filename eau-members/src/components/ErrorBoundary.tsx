import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { clearSupabaseCache } from '../utils/clearCache'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReset = () => {
    console.log('ErrorBoundary: Performing full reset')
    clearSupabaseCache()
    localStorage.clear()
    sessionStorage.clear()
    // Force redirect to login page
    window.location.href = '/login'
  }

  private handleHardReload = () => {
    console.log('ErrorBoundary: Performing hard reload')
    localStorage.clear()
    sessionStorage.clear()
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              An error occurred while loading the application. This might be due to cached data.
            </p>
            <div className="space-y-2">
              <button
                onClick={this.handleReset}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors font-medium"
              >
                🔧 Clear All Data & Go to Login
              </button>
              <button
                onClick={this.handleHardReload}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors font-medium"
              >
                🔄 Hard Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition-colors"
              >
                📋 Go to Login Page
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}