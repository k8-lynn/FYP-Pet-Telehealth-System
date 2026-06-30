//useOnlineStatus.js
import { useEffect } from 'react';

export const useOnlineStatus = (userId) => {
  useEffect(() => {
    if (!userId) {
      console.log('⚠️ useOnlineStatus: No userId provided, skipping');
      return;
    }

    console.log('🟢 useOnlineStatus: Setting user online for userId:', userId);


    const updateOnlineStatus = async (status) => {
      try {
        const response = await fetch('https://fyp-pet-telehealth-system.onrender.com/api/user/online-status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usr_id: userId, is_online: status })
        });
        
        const data = await response.json();
        console.log(`✅ Global online status updated to: ${status} for user ${userId}`, data);
      } catch (error) {
        console.error('❌ Error updating online status:', error);
      }
    };

    // Set online when component mounts
    updateOnlineStatus('yes');

    // Handle browser close/refresh
    const handleBeforeUnload = () => {
      // Use sendBeacon for more reliable delivery on page unload
      const blob = new Blob(
        [JSON.stringify({ usr_id: userId, is_online: 'no' })],
        { type: 'application/json' }
      );
      navigator.sendBeacon('https://fyp-pet-telehealth-system.onrender.com/api/user/online-status', blob);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on unmount
    return () => {
      console.log('🔴 Setting user offline for userId:', userId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Set offline immediately on unmount
      updateOnlineStatus('no');
    };
  }, [userId]); // Re-run when userId changes
};