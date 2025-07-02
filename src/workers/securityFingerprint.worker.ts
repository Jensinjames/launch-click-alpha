// Web Worker for expensive security fingerprinting
self.onmessage = async function(e) {
  const { type } = e.data;
  
  if (type === 'generateFingerprint') {
    try {
      // Generate canvas fingerprint
      const canvas = new OffscreenCanvas(200, 50);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Security fingerprint', 2, 2);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Performance optimized', 4, 17);
      }
      
      const fingerprint = [
        self.navigator.userAgent,
        self.navigator.language,
        self.screen.width + 'x' + self.screen.height,
        new Date().getTimezoneOffset().toString(),
        canvas ? await canvas.convertToBlob().then(blob => blob.size.toString()) : 'unknown'
      ].join('|');
      
      // Hash the fingerprint using crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(fingerprint);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      self.postMessage({ 
        type: 'fingerprintGenerated', 
        fingerprint: hash 
      });
    } catch (error) {
      self.postMessage({ 
        type: 'fingerprintError', 
        error: 'Failed to generate fingerprint' 
      });
    }
  }
};