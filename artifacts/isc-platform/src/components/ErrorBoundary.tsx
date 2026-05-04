import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ISC ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Une erreur est survenue</h2>
            <p className="text-muted-foreground text-sm max-w-md">
              Une erreur inattendue s'est produite. Veuillez rafraîchir la page ou contacter le support si le problème persiste.
            </p>
            {this.state.error && (
              <details className="text-xs text-muted-foreground mt-2">
                <summary className="cursor-pointer hover:text-foreground">Détails techniques</summary>
                <pre className="mt-2 text-left bg-muted p-3 rounded-lg overflow-auto max-w-lg">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Rafraîchir la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
