import { AlertCircle, Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="api-state">
      <Loader2 className="spinner" />
      <span>{message}</span>
    </div>
  );
}

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="api-state error">
      <AlertCircle />
      <span>{message}</span>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry} style={{ marginLeft: 'var(--sp-3)' }}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'No data available' }: { message?: string }) {
  return (
    <div className="api-state">
      <span style={{ color: 'var(--text-muted)' }}>{message}</span>
    </div>
  );
}
