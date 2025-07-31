/**
 * Utility functions for IP address handling
 */

/**
 * Get the real client IP address from request
 * Handles various proxy scenarios and IPv6 addresses
 */
export const getClientIP = (req) => {
  // Check for forwarded headers first (when behind proxy/load balancer)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    const firstIP = ips[0];
    // Convert IPv6 loopback to IPv4 for consistency
    if (firstIP === '::1') {
      return '127.0.0.1';
    }
    return firstIP;
  }

  // Check for other proxy headers
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    if (realIP === '::1') {
      return '127.0.0.1';
    }
    return realIP;
  }

  // Check for Cloudflare headers
  const cfConnectingIP = req.headers['cf-connecting-ip'];
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Use Express's req.ip (works with trust proxy)
  if (req.ip) {
    if (req.ip === '::1') {
      return '127.0.0.1';
    }
    return req.ip;
  }

  // Fallback to connection remote address
  if (req.connection && req.connection.remoteAddress) {
    const remoteAddr = req.connection.remoteAddress;
    if (remoteAddr === '::1') {
      return '127.0.0.1';
    }
    return remoteAddr;
  }

  // Check socket remote address
  if (req.socket && req.socket.remoteAddress) {
    const socketAddr = req.socket.remoteAddress;
    if (socketAddr === '::1') {
      return '127.0.0.1';
    }
    return socketAddr;
  }

  // Final fallback
  return 'unknown';
};

/**
 * Check if IP address is localhost/loopback
 */
export const isLocalhost = (ip) => {
  return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
};

/**
 * Get detailed IP information for debugging
 */
export const getIPInfo = (req) => {
  return {
    extractedIP: getClientIP(req),
    reqIp: req.ip,
    remoteAddress: req.connection?.remoteAddress,
    socketAddress: req.socket?.remoteAddress,
    xForwardedFor: req.headers['x-forwarded-for'],
    xRealIp: req.headers['x-real-ip'],
    cfConnectingIP: req.headers['cf-connecting-ip'],
    userAgent: req.get('User-Agent'),
    host: req.get('Host'),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    // Include all headers for debugging
    allHeaders: req.headers
  };
};

/**
 * Sanitize IP address for storage
 */
export const sanitizeIP = (ip) => {
  if (!ip || ip === 'unknown') {
    return 'unknown';
  }
  
  // Convert IPv6 loopback to IPv4
  if (ip === '::1') {
    return '127.0.0.1';
  }
  
  // Remove IPv6 prefix if present
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  
  return ip;
}; 