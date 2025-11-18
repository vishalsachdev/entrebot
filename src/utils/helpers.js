/**
 * Helper Utilities
 */

/**
 * Sleep for specified milliseconds
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry function with exponential backoff
 */
export const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      await sleep(delay * Math.pow(2, attempt - 1));
    }
  }
};

/**
 * Sanitize error for user display
 */
export const sanitizeError = (error) => {
  if (error.message.includes('API')) {
    return 'Service temporarily unavailable. Please try again.';
  }
  if (error.message.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  return 'An error occurred. Please try again.';
};

/**
 * Parse JSON safely
 */
export const parseJSON = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

export default {
  sleep,
  retry,
  sanitizeError,
  parseJSON
};
