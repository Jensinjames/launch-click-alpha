// Feature Access Context - Centralized Caching and State Management
import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useFeatureAccessBulk, FeatureAccessResult } from '@/hooks/useFeatureAccessBulk';
import { FeatureAccessErrorBoundary } from '@/components/providers/FeatureAccessErrorBoundary';

interface FeatureAccessContextType {
  hasAccess: (featureName: string) => boolean;
  canUseAny: (features: string[]) => boolean;
  canUseAll: (features: string[]) => boolean;
  isLoading: boolean;
  error: any;
  preloadFeatures: (features: string[]) => void;
}

const FeatureAccessContext = createContext<FeatureAccessContextType | undefined>(undefined);

// Common features used across the app
const CORE_FEATURES = [
  'dashboard',
  'content_generation',
  'analytics',
  'teams',
  'integrations',
  'admin_panel',
  'billing',
  'templates',
  'image_generation'
];

interface FeatureAccessProviderProps {
  children: React.ReactNode;
  preloadFeatures?: string[];
}

export const FeatureAccessProvider: React.FC<FeatureAccessProviderProps> = ({ 
  children, 
  preloadFeatures = CORE_FEATURES 
}) => {
  const { data: accessMap = {}, isLoading, error } = useFeatureAccessBulk(preloadFeatures);

  // If there's a critical error, render with empty access map
  if (error && !accessMap) {
    console.warn('[FeatureAccess] Provider error, using fallback mode:', error);
  }

  const hasAccess = useCallback((featureName: string) => {
    return accessMap[featureName] || false;
  }, [accessMap]);

  const canUseAny = useCallback((features: string[]) => {
    return features.some(feature => accessMap[feature]);
  }, [accessMap]);

  const canUseAll = useCallback((features: string[]) => {
    return features.every(feature => accessMap[feature]);
  }, [accessMap]);

  const preloadFeaturesFn = useCallback((features: string[]) => {
    // This would trigger a new query with additional features
    // For now, we'll log it for future implementation
    console.log('[FeatureAccess] Preload requested for:', features);
  }, []);

  const value = useMemo(() => ({
    hasAccess,
    canUseAny,
    canUseAll,
    isLoading,
    error,
    preloadFeatures: preloadFeaturesFn,
  }), [hasAccess, canUseAny, canUseAll, isLoading, error, preloadFeaturesFn]);

  return (
    <FeatureAccessErrorBoundary>
      <FeatureAccessContext.Provider value={value}>
        {children}
      </FeatureAccessContext.Provider>
    </FeatureAccessErrorBoundary>
  );
};

export const useFeatureAccessContext = () => {
  const context = useContext(FeatureAccessContext);
  if (context === undefined) {
    throw new Error('useFeatureAccessContext must be used within a FeatureAccessProvider');
  }
  return context;
};