/**
 * Utility function to show styled alerts using the toast notification system
 * Replaces native alert() with styled toasts that match the app's design
 */

/**
 * Determines toast type and title based on message content
 * @param {string} message - The alert message
 * @returns {Object} - Object with type, title, and message
 */
const determineToastType = (message) => {
  const lowerMessage = message.toLowerCase();

  // Success messages
  if (
    lowerMessage.includes('successfully') ||
    lowerMessage.includes('success') ||
    lowerMessage.includes('saved successfully') ||
    lowerMessage.includes('added successfully') ||
    lowerMessage.includes('created successfully') ||
    lowerMessage.includes('updated successfully') ||
    lowerMessage.includes('deleted successfully') ||
    lowerMessage.includes('removed successfully') ||
    lowerMessage.includes('uploaded successfully') ||
    lowerMessage.includes('cancelled successfully') ||
    lowerMessage.includes('registered successfully') ||
    lowerMessage.includes('assigned successfully') ||
    lowerMessage.includes('approved successfully') ||
    lowerMessage.includes('rescheduled successfully') ||
    lowerMessage.includes('booked successfully') ||
    lowerMessage.includes('generated successfully') ||
    lowerMessage.includes('updated successfully')
  ) {
    return {
      type: 'success',
      title: '✅ Success'
    };
  }

  // Error/Failed messages
  if (
    lowerMessage.includes('failed') ||
    lowerMessage.includes('error') ||
    lowerMessage.includes('unable') ||
    lowerMessage.includes('not found') ||
    lowerMessage.includes('could not') ||
    lowerMessage.includes('cannot') ||
    lowerMessage.includes('invalid')
  ) {
    return {
      type: 'error',
      title: '❌ Error'
    };
  }

  // Warning/Validation messages
  if (
    lowerMessage.includes('please') ||
    lowerMessage.includes('required') ||
    lowerMessage.includes('fill in') ||
    lowerMessage.includes('select') ||
    lowerMessage.includes('provide') ||
    lowerMessage.includes('must be') ||
    lowerMessage.includes('already exists') ||
    lowerMessage.includes('already registered') ||
    lowerMessage.includes('file size')
  ) {
    return {
      type: 'info',
      title: 'ℹ️ Notice'
    };
  }

  // Info messages (default)
  return {
    type: 'info',
    title: 'ℹ️ Information'
  };
};

/**
 * Shows a styled alert using the toast notification system
 * Falls back to native alert if toast system is not available
 * @param {string} message - The message to display
 */
export const showStyledAlert = (message) => {
  // Check if window.showToast is available
  if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
    const { type, title } = determineToastType(message);
    window.showToast(type, title, message);
  } else {
    // Fallback to native alert if toast system not available
    alert(message);
  }
};

/**
 * Replacement for native alert() that uses styled toasts
 * This function can be used as a direct drop-in replacement for alert()
 */
export default showStyledAlert;





