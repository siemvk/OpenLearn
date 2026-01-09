import { createStore } from 'zustand/vanilla'
import { getStreakData } from '@/serverActions/getStreakData'

export interface WeekActivity {
  date: string;
  hasActivity: boolean;
  isFrozen: boolean;
}

export interface StreakData {
  streak: number;
  freezes: number;
  weekActivity: WeekActivity[];
}

export interface StreakUpdateResult {
  success: boolean;
  streakUpdated?: boolean;
  currentStreak?: number;
  isNewStreak?: boolean;
  freezeAwarded?: boolean;
  freezeUsed?: boolean;
  message?: string;
}

export interface StreakResetResult {
  success: boolean;
  streakReset?: boolean;
  message?: string;
}

export interface StreakStore extends StreakData {
  // Actions
  updateStreak: () => Promise<StreakUpdateResult>;
  resetLostStreak: () => Promise<StreakResetResult>;
  refreshData: () => Promise<void>;

  // Helper methods
  isActiveStreak: () => boolean;
}

// Store factory for SSR hydration
export const createStreakStore = (initData?: Partial<StreakData>) =>
  createStore<StreakStore>((set, get) => ({
    // Initial state
    streak: initData?.streak || 0,
    freezes: initData?.freezes || 0,
    weekActivity: initData?.weekActivity || [],

    // Update streak (called when completing a practice list)
    updateStreak: async () => {
      try {
        const response = await fetch('/api/v1/streak/update', {
          method: 'POST',
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to update streak');
        }

        // Refresh data after successful update
        await get().refreshData();

        // Trigger global event for other components
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('streak-data-updated');
          window.dispatchEvent(event);
        }

        return result;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error updating streak:', error);

        return {
          success: false,
          message: errorMessage,
        };
      }
    },

    // Reset lost streak
    resetLostStreak: async () => {
      try {
        const response = await fetch('/api/v1/streak/reset', {
          method: 'POST',
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to reset streak');
        }

        // Refresh data after successful reset
        await get().refreshData();

        // Trigger global event for other components
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('streak-data-updated');
          window.dispatchEvent(event);
        }

        return result;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error resetting lost streak:', error);

        return {
          success: false,
          message: errorMessage,
          streakReset: false,
        };
      }
    },

    // Refresh data from server using server action
    refreshData: async () => {
      try {
        // Call the server action directly
        const result = await getStreakData();

        // Update state with fresh data
        set({
          streak: result.streak,
          freezes: result.freezes,
          weekActivity: result.weekActivity,
        });

      } catch (error) {
        console.error('Error refreshing streak data:', error);
      }
    },

    // Helper method to check if streak is active
    isActiveStreak: () => {
      return get().streak > 0;
    },
  }));
