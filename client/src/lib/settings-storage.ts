/**
 * Settings Storage - Local storage for settings persistence
 * Stores settings like business profile locally with fallback
 */

interface StoreProfile {
  id?: number;
  storeName: string;
  ownerName: string;
  address: string;
  storeType?: string;
  location?: string;
  phone?: string;
  email?: string;
  description?: string;
  updated_at?: string;
}

const STORE_PROFILE_KEY = 'dukafiti_store_profile';

export function getStoreProfile(): StoreProfile | null {
  try {
    const stored = localStorage.getItem(STORE_PROFILE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    
  }
  return null;
}

export function saveStoreProfile(profile: StoreProfile): void {
  try {
    const profileWithTimestamp = {
      ...profile,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(STORE_PROFILE_KEY, JSON.stringify(profileWithTimestamp));
  } catch (error) {
    
  }
}

export function clearStoreProfile(): void {
  try {
    localStorage.removeItem(STORE_PROFILE_KEY);
  } catch (error) {
    
  }
}