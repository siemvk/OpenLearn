"use server"

import { getUserFromSession } from '@/utils/auth/auth';
import { prisma } from '@/utils/prisma';
import { cookies } from 'next/headers';
import type { StreakData, WeekActivity } from '@/store/streak/StreakData';

export async function getStreakData(): Promise<StreakData> {
  try {
    const sessionId = (await cookies()).get("polarlearn.session-id")?.value as string;
    const user = await getUserFromSession(sessionId);

    if (!user?.id) {
      return {
        streak: 0,
        freezes: 0,
        weekActivity: []
      };
    }

    // Check if getUserFromSession already includes the data we need
    let streakCount = user.streakCount;
    let freezeCount = user.freezeCount;
    let streakData = user.streakData;
    let lastActivity = user.lastActivity;

    // If the session user doesn't include complete data, then fetch only what's missing
    if (streakCount === undefined || freezeCount === undefined || streakData === undefined || lastActivity === undefined) {
      // Only fetch what we're missing
      const userData = await prisma.user.findFirst({
        where: {
          id: user.id
        },
        select: {
          streakCount: streakCount === undefined,
          freezeCount: freezeCount === undefined,
          streakData: streakData === undefined,
          lastActivity: lastActivity === undefined
        }
      });

      if (userData) {
        streakCount = streakCount ?? userData.streakCount;
        freezeCount = freezeCount ?? userData.freezeCount;
        streakData = streakData ?? userData.streakData;
        lastActivity = lastActivity ?? userData.lastActivity;
      }
    }

    // Default values for safety
    streakCount = streakCount ?? 0;
    freezeCount = freezeCount ?? 0;
    streakData = streakData ?? {};

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if user had activity yesterday (or used a freeze)
    let yesterdayActivity = (streakData as Record<string, string>)[yesterdayStr];
    let hadActivityYesterday = yesterdayActivity === 'done' || yesterdayActivity === 'frozen';

    // Auto-apply freeze if needed: no activity yesterday but has freezes and streak > 0
    let freezeApplied = false;
    if (!hadActivityYesterday && freezeCount > 0 && streakCount > 0) {
      // Apply freeze to yesterday automatically
      (streakData as Record<string, string>)[yesterdayStr] = 'frozen';
      freezeCount = freezeCount - 1;
      hadActivityYesterday = true;
      freezeApplied = true;

      console.log(`Auto-applied freeze for user ${user.id} on ${yesterdayStr}`);
    }

    // Always recalculate streak count based on consecutive days from yesterday backwards
    // Like Duolingo: the streak persists until you've completely missed a day (i.e., yesterday had no activity)
    let currentStreakCount = 0;
    const todayDate = new Date();

    // Check today's activity
    const todayStr = todayDate.toISOString().split('T')[0];
    const hasTodayActivity = (streakData as Record<string, string>)[todayStr] === 'done';

    // Start counting from yesterday (i=1), not today
    // This way, if you haven't practiced today yet, you still see yesterday's streak
    for (let i = (hasTodayActivity ? 0 : 1); i < 365; i++) {
      const checkDate = new Date(todayDate);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = checkDate.toISOString().split('T')[0];

      const activity = (streakData as Record<string, string>)[checkDateStr];
      if (activity === 'done') {
        currentStreakCount++;
      } else if (activity === 'frozen') {
        // Frozen days don't count toward streak but don't break it
        // Continue without incrementing
        continue;
      } else {
        break; // Stop at first gap
      }
    }

    // Use the recalculated streak count
    streakCount = currentStreakCount;

    // Update database with recalculated streak count and any freeze changes
    if (freezeApplied || currentStreakCount !== (user.streakCount || 0)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          streakData: streakData,
          freezeCount: freezeCount,
          streakCount: streakCount
        }
      });
    }

    // Generate week activity data (last 7 days)
    const weekActivity: WeekActivity[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayActivity = (streakData as Record<string, string>)[dateStr];
      weekActivity.push({
        date: dateStr,
        hasActivity: dayActivity === 'done',
        isFrozen: dayActivity === 'frozen'
      });
    }

    return {
      streak: streakCount,
      freezes: freezeCount,
      weekActivity
    };

  } catch (error) {
    console.error('Error fetching streak data:', error);
    return {
      streak: 0,
      freezes: 0,
      weekActivity: []
    };
  }
}
