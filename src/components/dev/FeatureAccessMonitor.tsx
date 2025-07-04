// Development Performance Monitor for Feature Access
import { useFeatureAccessContext } from '@/contexts/FeatureAccessContext';
import { useState, useEffect } from 'react';

export const FeatureAccessMonitor = () => {
  const { performanceMetrics, isLoading, error } = useFeatureAccessContext();
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development mode
  useEffect(() => {
    const isDev = import.meta.env.DEV;
    setIsVisible(isDev);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 right-0 m-4 p-3 bg-background border rounded-lg shadow-lg text-xs space-y-1 z-50 max-w-xs">
      <div className="font-semibold text-primary">Feature Access Monitor</div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={`font-medium ${isLoading ? 'text-yellow-500' : error ? 'text-red-500' : 'text-green-500'}`}>
            {isLoading ? 'Loading' : error ? 'Error' : 'Ready'}
          </span>
        </div>
        
        {performanceMetrics.loadTime && (
          <div className="flex justify-between">
            <span>Load Time:</span>
            <span className="font-medium">{performanceMetrics.loadTime.toFixed(2)}ms</span>
          </div>
        )}
        
        {performanceMetrics.cacheHitRate && (
          <div className="flex justify-between">
            <span>Cache Rate:</span>
            <span className="font-medium">{(performanceMetrics.cacheHitRate * 100).toFixed(1)}%</span>
          </div>
        )}
        
        {performanceMetrics.lastRefresh && (
          <div className="flex justify-between">
            <span>Last Refresh:</span>
            <span className="font-medium">
              {new Date(performanceMetrics.lastRefresh).toLocaleTimeString()}
            </span>
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-xs mt-2 p-1 bg-red-50 rounded">
            {error.message || 'Unknown error'}
          </div>
        )}
      </div>
    </div>
  );
};