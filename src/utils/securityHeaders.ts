
// Security Headers Utility with Enhanced CSP
export const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const addSecurityHeaders = () => {
  // Generate nonce for inline scripts/styles
  const nonce = generateCSPNonce();
  
  // Determine if we're in production - check both NODE_ENV and PROD
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development' || !isProduction;
  
  // Development-friendly CSP - allow React/Vite to work properly
  const cspDirectives = [
    "default-src 'self'",
    isDevelopment 
      ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' https://supabase.co https://*.supabase.co http://localhost:* ws://localhost:* wss://localhost:*`
      : `script-src 'self' 'nonce-${nonce}' https://supabase.co https://*.supabase.co`,
    isDevelopment
      ? `style-src 'self' 'unsafe-inline' 'nonce-${nonce}' https://fonts.googleapis.com`
      : `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    isDevelopment
      ? `style-src-elem 'self' 'unsafe-inline' 'nonce-${nonce}' https://fonts.googleapis.com`
      : `style-src-elem 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com",
    isDevelopment 
      ? "img-src 'self' data: https: blob: http://localhost:*"
      : "img-src 'self' data: https: blob:",
    isDevelopment
      ? "connect-src 'self' https://supabase.co https://*.supabase.co wss://*.supabase.co https://gbdmxgkkjekiaqpsyeib.supabase.co http://localhost:* ws://localhost:* wss://localhost:*"
      : "connect-src 'self' https://supabase.co https://*.supabase.co wss://*.supabase.co https://gbdmxgkkjekiaqpsyeib.supabase.co",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    // frame-ancestors removed - cannot be set via meta tag
    isProduction ? "upgrade-insecure-requests" : ""
  ].filter(directive => directive !== "").join('; ');

  // Create meta tag for CSP
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = cspDirectives;
  
  // Remove existing CSP meta tag if present
  const existingCsp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCsp) {
    existingCsp.remove();
  }
  
  document.head.appendChild(cspMeta);

  // Add other security meta tags with enhanced settings
  // Note: X-Frame-Options cannot be set via meta tags - use server-side headers for clickjacking protection
  const securityTags = [
    { httpEquiv: 'X-Content-Type-Options', content: 'nosniff' },
    { httpEquiv: 'X-XSS-Protection', content: '1; mode=block' },
    { httpEquiv: 'Referrer-Policy', content: 'strict-origin-when-cross-origin' },
    { httpEquiv: 'Permissions-Policy', content: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
    { httpEquiv: 'Cross-Origin-Embedder-Policy', content: 'require-corp' },
    { httpEquiv: 'Cross-Origin-Opener-Policy', content: 'same-origin' },
    { httpEquiv: 'Cross-Origin-Resource-Policy', content: 'same-origin' }
  ];

  securityTags.forEach(({ httpEquiv, content }) => {
    const existing = document.querySelector(`meta[http-equiv="${httpEquiv}"]`);
    if (existing) {
      existing.remove();
    }
    
    const meta = document.createElement('meta');
    meta.httpEquiv = httpEquiv;
    meta.content = content;
    document.head.appendChild(meta);
  });
};

// Initialize security headers on app start
export const initializeSecurity = () => {
  // Only apply security headers once to avoid duplicates
  if (document.querySelector('meta[data-security-initialized]')) {
    console.log('[Security] Headers already initialized, skipping duplicate initialization');
    return;
  }
  
  addSecurityHeaders();
  
  // Mark as initialized
  const marker = document.createElement('meta');
  marker.setAttribute('data-security-initialized', 'true');
  document.head.appendChild(marker);
  
  const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';
  
  // Disable right-click context menu in production only
  if (isProduction) {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  // Disable common developer shortcuts in production only
  if (isProduction) {
    document.addEventListener('keydown', (e) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
        (e.key === 'F12')
      ) {
        e.preventDefault();
      }
    });
  }
  
  console.log(`[Security] Headers initialized for ${isProduction ? 'production' : 'development'} environment`);
};
