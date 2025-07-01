
// Security Headers Utility with Enhanced CSP
export const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const addSecurityHeaders = () => {
  // Generate nonce for inline scripts/styles
  const nonce = generateCSPNonce();
  
  // Enhanced Content Security Policy - optimized for meta tag delivery
  // Note: frame-ancestors directive is ignored in meta tags, use server-side headers for clickjacking protection
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://supabase.co https://*.supabase.co`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://supabase.co https://*.supabase.co wss://*.supabase.co",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "upgrade-insecure-requests"
  ].join('; ');

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
  addSecurityHeaders();
  
  // Disable right-click context menu in production
  if (import.meta.env.PROD) {
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  // Disable common developer shortcuts in production
  if (import.meta.env.PROD) {
    document.addEventListener('keydown', (e) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
        (e.key === 'F12')
      ) {
        e.preventDefault();
      }
    });
  }
};
