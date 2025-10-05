"use server"

import { getUserFromSession } from '@/utils/auth/auth'
import { prisma } from '@/utils/prisma'
import { cookies } from 'next/headers'

export async function getFreezes() {
    const session = await getUserFromSession((await cookies()).get("polarlearn.session-id")?.value as string)
    if (!session?.id) return 0;

    // Use the optimized getAllStreakData function instead
    const data = await getAllStreakData();
    return data.freezes;
}

export async function getStreak() {
    const session = await getUserFromSession((await cookies()).get("polarlearn.session-id")?.value as string)
    if (!session?.id) return 0;

    // Use the optimized getAllStreakData function instead
    const data = await getAllStreakData();
    return data.streak;
}

export async function getWeekActivity() {
    const session = await getUserFromSession((await cookies()).get("polarlearn.session-id")?.value as string)
    if (!session?.id) return []

    const user = await prisma.user.findFirst({
        where: {
            id: session.id
        },
        select: {
            streakData: true
        }
    })

    // Get dates for the past 7 days
    const today = new Date()
    const pastWeek = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0] // Format as YYYY-MM-DD
    }).reverse() // Show oldest to newest (left to right)

    // Convert the streakData JSON to a usable format
    const streakData = user?.streakData as Record<string, string> || {}

    // Map the dates to statuses - only entries that exist in the database will be 'done' or 'frozen'
    return pastWeek.map(date => {
        const status = streakData[date] || 'none' // Default to 'none' if no data
        return { date, status }
    })
}

// Optimize getAllStreakData to use the data already returned by getUserFromSession
export async function getAllStreakData() {
    try {
        const sessionId = (await cookies()).get("polarlearn.session-id")?.value as string;
        // This is likely already fetching the full user profile
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

        // Get dates for the past 7 days
        const today = new Date();
        const pastWeek = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        }).reverse();

        // Convert the streakData JSON to a usable format
        const streakDataObj = streakData as Record<string, string> || {};

        // Check if streak should be reset due to missed days
        let finalStreakCount = streakCount || 0;

        // Get yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // Get day before yesterday's date (to check for freezes)
        const dayBeforeYesterday = new Date();
        dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

        let hadYesterdayActivity = streakDataObj[yesterdayStr] === 'done' || streakDataObj[yesterdayStr] === 'frozen';

        // Auto-apply freeze if needed: no activity yesterday but has freezes and streak > 0
        let freezeApplied = false;
        let updatedFreezeCount = freezeCount || 0;
        if (!hadYesterdayActivity && updatedFreezeCount > 0 && finalStreakCount > 0) {
            // Apply freeze to yesterday automatically
            streakDataObj[yesterdayStr] = 'frozen';
            updatedFreezeCount = updatedFreezeCount - 1;
            hadYesterdayActivity = true;
            freezeApplied = true;

            console.log(`Auto-applied freeze for user ${user.id} on ${yesterdayStr}`);
        }

        // Always recalculate streak count based on consecutive days from today backwards
        let currentStreakCount = 0;
        // Always start counting from today, regardless of today's activity status
        const todayDate = new Date();
        for (let i = 0; i < 365; i++) { // Max reasonable streak length
            const checkDate = new Date(todayDate);
            checkDate.setDate(checkDate.getDate() - i);
            const checkDateStr = checkDate.toISOString().split('T')[0];

            const activity = streakDataObj[checkDateStr];
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
        finalStreakCount = currentStreakCount;

        // Update database with recalculated streak count and any freeze changes
        if (freezeApplied || currentStreakCount !== (streakCount || 0)) {
            try {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        streakData: streakDataObj,
                        freezeCount: updatedFreezeCount,
                        streakCount: finalStreakCount
                    }
                });
            } catch (error) {
                console.error("Error updating streak data in database:", error);
            }
        }

        // Update weekActivity to reflect any freeze that was applied
        const weekActivity = pastWeek.map(date => {
            const status = streakDataObj[date] || 'none';
            return { date, status };
        });

        return {
            streak: finalStreakCount,
            freezes: updatedFreezeCount,
            weekActivity
        };
    } catch (error) {
        console.error("Error fetching all streak data:", error);
        return {
            streak: 0,
            freezes: 0,
            weekActivity: []
        };
    }
}