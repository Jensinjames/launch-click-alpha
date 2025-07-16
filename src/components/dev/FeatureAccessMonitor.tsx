// Development Performance Monitor for Feature Access
import { useFeatureAccessContext } from '@/contexts/SimpleFeatureAccessContext';
import { useState, useEffect } from 'react';

export const FeatureAccessMonitor = () => {
  const { isLoading, error } = useFeatureAccessContext();
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development mode
  useEffect(() => {
    const isDev = import.meta.env.DEV;
    setIsVisible(isDev);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-0 right-0 m-4 p-3 bg-card border rounded-lg shadow-lg text-xs space-y-1 z-40 max-w-xs"
      role="status" 
      aria-live="polite"
      aria-label="Development feature access monitor"
      aria-hidden="false"
    >
      <div className="font-semibold text-primary">Feature Access Monitor</div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={`font-medium ${
            isLoading ? 'text-warning' : error ? 'text-error' : 'text-success'
          }`}>
            {isLoading ? 'Loading' : error ? 'Error' : 'Ready'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Timestamp:</span>
          <span className="font-medium">{new Date().toLocaleTimeString()}</span>
        </div>
        
        {error && (
          <div className="text-error text-xs mt-2 p-1 bg-error-light rounded" role="alert">
            {(error as Error)?.message || 'Unknown error'}
          </div>
        )}
      </div>
    </div>
  );
};