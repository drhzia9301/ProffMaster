// Storage key for AI API
const API_KEY_STORAGE_KEY = 'ai_api_key';

export interface APIKeyConfig {
  apiKey: string | null;
  hasCustomKey: boolean;
}

/**
 * Get API key (user's key only, no default)
 */
export const getApiKey = (): string => {
  try {
    const userKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (userKey && userKey.trim() !== '') {
      return userKey;
    }
    return ''; // No default key
  } catch (error) {
    return '';
  }
};

/**
 * Check if user has custom API key
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
 * Save API key
 */
export const setApiKey = (key: string): boolean => {
  try {
    if (!key || key.trim() === '') {
      throw new Error('API key cannot be empty');
    }
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    return true;
  } catch (error) {
    console.error('Error saving API key:', error);
    return false;
  }
};

/**
 * Remove API key
 */
export const removeApiKey = (): boolean => {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if API key is configured (user must have added a key)
 */
export const hasApiKey = (): boolean => {
  return hasCustomApiKey();
};

