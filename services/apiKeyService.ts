const API_KEY_STORAGE_KEY = 'gemini_api_key';

/**
 * Get the stored API key from localStorage
 */
export const getApiKey = (): string | null => {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error('Error reading API key from localStorage:', error);
    return null;
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
 * Check if API key is configured
 */
export const hasApiKey = (): boolean => {
  const key = getApiKey();
  return key !== null && key.trim() !== '';
};
