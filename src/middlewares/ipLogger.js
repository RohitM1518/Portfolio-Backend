import { getClientIP, sanitizeIP } from '../utils/ipUtils.js';

/**
 * Middleware to log IP addresses for debugging
 */
export const ipLogger = (req, res, next) => {
  const originalIP = getClientIP(req);
  const sanitizedIP = sanitizeIP(originalIP);
  
  // Log IP information for debugging
  console.log(`[IP Logger] ${req.method} ${req.path}`);
  console.log(`[IP Logger] Original IP: ${originalIP}`);
  console.log(`[IP Logger] Sanitized IP: ${sanitizedIP}`);
  console.log(`[IP Logger] User Agent: ${req.get('User-Agent')}`);
  console.log(`[IP Logger] X-Forwarded-For: ${req.headers['x-forwarded-for']}`);
  console.log(`[IP Logger] X-Real-IP: ${req.headers['x-real-ip']}`);
  console.log(`[IP Logger] CF-Connecting-IP: ${req.headers['cf-connecting-ip']}`);
  console.log(`[IP Logger] ---`);
  
  // Add IP info to request object for use in controllers
  req.clientIP = sanitizedIP;
  req.originalIP = originalIP;
  
  next();
};

/**
 * Conditional IP logger - only logs in development
 */
export const conditionalIpLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    return ipLogger(req, res, next);
  }
  
  // In production, just add IP info without logging
  const originalIP = getClientIP(req);
  const sanitizedIP = sanitizeIP(originalIP);
  
  req.clientIP = sanitizedIP;
  req.originalIP = originalIP;
  
  next();
}; 