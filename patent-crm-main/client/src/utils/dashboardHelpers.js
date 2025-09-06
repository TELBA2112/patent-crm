/**
 * Dashboard components uchun yordamchi funksiyalar
 */

// MKTU bilan bog'liq helperlar olib tashlandi.
export const clearStoredMktuData = () => {
  localStorage.removeItem('selectedMktuClasses');
  console.log("Cleared MKTU data from localStorage");
};

// Force share MKTU data across all components
export const forceShareMktuData = (classes) => {
  if (Array.isArray(classes) && classes.length > 0) {
    localStorage.setItem('selectedMktuClasses', JSON.stringify(classes));
    
    // Dispatch a custom event to notify all components
    const event = new CustomEvent('mktuClassesUpdated', {
      detail: { classes }
    });
    document.dispatchEvent(event);
    
    console.log("Force shared MKTU classes:", classes);
    return true;
  }
  return false;
};

// Debug function to check what MKTU data is currently stored
export const debugStoredMktuData = () => {
  try {
    const storedClasses = localStorage.getItem('selectedMktuClasses');
    const parsed = storedClasses ? JSON.parse(storedClasses) : [];
    console.log("Currently stored MKTU classes:", parsed);
    return parsed;
  } catch (error) {
    console.error('Error parsing stored MKTU classes:', error);
    return [];
  }
};
