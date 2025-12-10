const API_KEY_STORAGE_KEY = 'gemini_api_key';
const FIRST_TIME_SHOWN_KEY = 'first_time_api_modal_shown';

// Default API key provided with the app
const DEFAULT_API_KEY = 'AIzaSyAmW-jKxPQ_3rlnEOp1TU0LfV9Eq0sk9oU';

/**
 * Get the stored API key from localStorage, or return default key
 */
export const getApiKey = (): string | null => {
  try {
    // First check if user has their own key
    const userKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (userKey && userKey.trim() !== '') {
      return userKey;
    }
    
    // Otherwise, return the default key
    return DEFAULT_API_KEY;
  } catch (error) {
    console.error('Error reading API key from localStorage:', error);
    return DEFAULT_API_KEY;
  }
};

/**
 * Check if user has set their own custom API key
 */
export const hasCustomApiKey = (): boolean => {
  try {
    const userKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    return userKey !== null && userKey.trim() !== '';
  } catch (error) {
    return false;
  }
};

/**
 * Check if using the default built-in key
 */
export const isUsingDefaultKey = (): boolean => {
  return !hasCustomApiKey();
};

/**
 * Check if first time API modal has been shown
 */
export const hasShownFirstTimeModal = (): boolean => {
  try {
    return localStorage.getItem(FIRST_TIME_SHOWN_KEY) === 'true';
  } catch (error) {
    return false;
  }
};

/**
 * Mark first time modal as shown
 */
export const markFirstTimeModalShown = (): void => {
  try {
    localStorage.setItem(FIRST_TIME_SHOWN_KEY, 'true');
  } catch (error) {
    console.error('Error saving first time modal state:', error);
  }
};

/**
 * Save API key to localStorage
 */
export const setApiKey = (key: string): boolean => {
  try {
    if (!key || key.trim() === '') {
      throw new Error('API key cannot be empty');
    }
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    return true;
  } catch (error) {
    console.error('Error saving API key to localStorage:', error);
    return false;
  }
};

/**
 * Remove API key from localStorage
 */
export const removeApiKey = (): boolean => {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error removing API key from localStorage:', error);
    return false;
  }
};

/**
 * Check if API key is configured (always true now since we have default)
 */
export const hasApiKey = (): boolean => {
  // Always returns true since we have a default key
  return true;
};

/**
 * Check if a custom user key is configured (not the default)
 */
export const hasUserConfiguredKey = (): boolean => {
  return hasCustomApiKey();
};
