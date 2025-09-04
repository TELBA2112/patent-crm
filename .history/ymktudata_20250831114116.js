// Fix the operatordashboard selection visibility issue
export const handleDashboardSelection = (selectedDashboard) => {
  // Store the selected dashboard in localStorage or state management
  localStorage.setItem('selectedDashboard', selectedDashboard);
  
  // Ensure visibility across all dashboard types
  if (selectedDashboard === 'operatordashboard') {
    // Make sure it's visible in checker and driving dashboards
    updateDashboardVisibility('checker', true);
    updateDashboardVisibility('driving', true);
  }
  
  // Return the selection for further processing
  return selectedDashboard;
}

// Helper function to update dashboard visibility
const updateDashboardVisibility = (dashboardType, isVisible) => {
  // Update visibility state for the specified dashboard type
  const visibilityKey = `${dashboardType}DashboardVisibility`;
  localStorage.setItem(visibilityKey, isVisible);
}