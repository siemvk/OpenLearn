'use client';

import { useCallback } from 'react';
import { useStreakStore } from '@/store/streak/StreakProvider';
import { useStore } from 'zustand';

// Hook for handling streak updates when completing practice lists
export const useStreakUpdate = () => {
  const store = useStreakStore();
  const updateStreak = useStore(store, (state) => state.updateStreak);
  const refreshData = useStore(store, (state) => state.refreshData);

  // Main function to call when a practice list is completed
  const handleListCompletion = useCallback(async () => {
    try {
      const result = await updateStreak();

      if (result.success) {
        return {
          success: true,
          streakUpdated: result.streakUpdated,
          currentStreak: result.currentStreak,
          isNewStreak: result.isNewStreak,
          freezeAwarded: result.freezeAwarded,
          freezeUsed: result.freezeUsed,
        };
      } else {
        console.error('Failed to update streak:', result.message);
        return {
          success: false,
          message: result.message,
        };
      }
    } catch (error) {
      console.error('Error updating streak on list completion:', error);
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }, [updateStreak]);

  // Function to manually refresh streak data
  const refreshStreak = useCallback(async () => {
    try {
      await refreshData();
    } catch (error) {
      console.error('Error refreshing streak data:', error);
    }
  }, [refreshData]);

  return {
    handleListCompletion,
    refreshStreak,
  };
};
