/**
 * Re-export authentication and authorization middlewares
 * Maintains backward compatibility while adhering to modular file structure
 */
export { authenticate } from './authMiddleware.js';
export { authorize } from './roleMiddleware.js';
