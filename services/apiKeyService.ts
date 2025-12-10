// Storage keys
const GEMINI_API_KEY_STORAGE_KEY = 'gemini_api_key';

// No default API keys - users must add their own
const DEFAULT_GEMINI_API_KEY = '';

export interface APIKeyConfig {
  geminiKey: string | null;
  hasCustomGeminiKey: boolean;
}

/**
 * Get Gemini API key (user's key only, no default)
 */
export const getGeminiApiKey = (): string => {
  try {
    const userKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
    if (userKey && userKey.trim() !== '') {
      return userKey;
    }
    return ''; // No default key
  } catch (error) {
    return '';
  }
};

/**
 * Check if user has custom Gemini key
 */
export const hasCustomGeminiKey = (): boolean => {
  try {
    const userKey = localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY);
    return userKey !== null && userKey.trim() !== '';
  } catch (error) {
    return false;
  }
};

/**
 * Save Gemini API key
 */
export const setGeminiApiKey = (key: string): boolean => {
  try {
    if (!key || key.trim() === '') {
      throw new Error('API key cannot be empty');
    }
    localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, key.trim());
    return true;
  } catch (error) {
    console.error('Error saving Gemini API key:', error);
    return false;
  }
};

/**
 * Remove Gemini API key
 */
export const removeGeminiApiKey = (): boolean => {
  try {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if API key is configured (user must have added at least one key)
 */
export const hasApiKey = (): boolean => {
  return hasCustomGeminiKey();
};