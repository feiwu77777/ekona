// Function to detect if the user is on mobile or desktop
function getDeviceType() {
  if (typeof window === 'undefined') return 'unknown';
  
  const isMobile =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    window.innerWidth <= 768;
  return isMobile ? "mobile" : "desktop";
}

// Generate or retrieve unique user ID with device type
export function getOrCreateUserId(): string {
  const storageKey = 'userId';
  let userId: string | null = null;
  
  // Check if we're in browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    userId = localStorage.getItem(storageKey);
    
    if (!userId) {
      // Generate unique ID with device type
      const device_type = getDeviceType();
      userId = "temp-" + device_type + "-" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(storageKey, userId);
    }
  } else {
    // Server-side fallback - generate temporary ID
    const device_type = 'unknown';
    userId = "temp-" + device_type + "-" + Math.random().toString(36).substr(2, 9);
  }
  
  return userId;
} 