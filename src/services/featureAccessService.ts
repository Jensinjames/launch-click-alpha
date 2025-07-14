// Feature Access Service - Centralized Feature Access Logic
export class FeatureAccessService {
  // Route-based feature mapping for lazy loading
  private static readonly ROUTE_FEATURES = {
    '/dashboard': ['content_generation', 'analytics'],
    '/generate': ['content_generation', 'templates', 'image_generation'],
    '/analytics': ['teams'],
    '/teams': [],
    '/integrations': [],
    '/settings': [],
    '/admin': ['page_access_admin'],
    '/billing': [],
  } as const;

  // Public routes that don't require authentication
  private static readonly PUBLIC_ROUTES = [
    '/', 
    '/login', 
    '/signup', 
    '/pricing'
  ];

  // Essential features - loaded immediately
  private static readonly ESSENTIAL_FEATURES = [
    'page_access_dashboard',
    'page_access_generate',
    'page_access_content',
    'page_access_assemblies',
    'page_access_teams',
    'page_access_analytics',
    'page_access_integrations',
    'page_access_settings',
    'page_access_billing'
  ];

  // Secondary features - loaded on demand
  private static readonly SECONDARY_FEATURES = [
    'page_access_admin',
    'content_generation',
    'templates',
    'image_generation',
    'teams',
    'analytics',
    'content_export_pdf',
    'content_export_bulk',
    'content_export_docx'
  ];

  /**
   * Check if a route is public (doesn't require authentication)
   */
  static isPublicRoute(route: string): boolean {
    return this.PUBLIC_ROUTES.includes(route);
  }

  /**
   * Get optimized features for a route
   */
  static getOptimizedFeatures(route?: string, preloadFeatures?: string[]): string[] {
    if (preloadFeatures) return preloadFeatures;
    
    // Load essential features + route-specific features only
    const routeSpecific = route && this.ROUTE_FEATURES[route as keyof typeof this.ROUTE_FEATURES] 
      ? this.ROUTE_FEATURES[route as keyof typeof this.ROUTE_FEATURES] 
      : [];
    
    // Combine essential + unique route features (avoid duplicates)
    const combined = [...this.ESSENTIAL_FEATURES, ...routeSpecific];
    return Array.from(new Set(combined));
  }

  /**
   * Check if user has access to a feature
   */
  static hasFeatureAccess(featureName: string, accessMap: Record<string, boolean>): boolean {
    return accessMap[featureName] || false;
  }

  /**
   * Check if user can use any of the specified features
   */
  static canUseAny(features: string[], accessMap: Record<string, boolean>): boolean {
    return features.some(feature => accessMap[feature]);
  }

  /**
   * Check if user can use all of the specified features
   */
  static canUseAll(features: string[], accessMap: Record<string, boolean>): boolean {
    return features.every(feature => accessMap[feature]);
  }

  /**
   * Create fallback access handler for error states
   */
  static createFallbackHandler() {
    return {
      hasAccess: () => true,
      canUseAny: () => true,
      canUseAll: () => true,
      isLoading: false,
      isAuthReady: true,
      error: null,
      preloadFeatures: () => {},
      performanceMetrics: {}
    };
  }
}