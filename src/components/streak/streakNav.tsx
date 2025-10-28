"use client"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Check, Flame, Snowflake, X } from "lucide-react"
import { useStreak, useFreezes, useWeekActivity } from '@/store/streak/StreakProvider'

export default function StreakNavbarThing() {
    // Use the new streak store hooks - much simpler!
    const streakCnt = useStreak();
    const freezeCnt = useFreezes();
    const weekActivity = useWeekActivity();
    const hasPracticedToday = weekActivity.some(day => {
        const today = new Date().toISOString().split('T')[0];
        return day.date === today && day.hasActivity;
    });

    const getStatusIcon = (activity: { hasActivity: boolean; isFrozen: boolean }) => {
        if (activity.hasActivity) {
            return <Check className="text-green-400" size={20} />;
        } else if (activity.isFrozen) {
            return <Snowflake className="text-blue-400" size={20} />;
        } else {
            return <X className="text-red-400" size={20} />;
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('nl-NL', { weekday: 'short' }).substring(0, 2)
    }

    return (
        <Popover>
            <PopoverTrigger className="streak">
                <div className="navbar-btn rounded-lg flex items-center justify-center min-w-40 min-h-10 hover:bg-neutral-700 transition-colors px-2">
                    <Flame className={`mr-1 ${hasPracticedToday ? "text-orange-400" : "text-white"}`} />
                    {streakCnt}
                </div>
            </PopoverTrigger>
            <PopoverContent className={`w-80 navbar-popover z-110 drop-shadow-2xl min-h-40 flex flex-col space-y-3 justify-center`}>
                <div className="flex flex-row space-x-3">
                    <div className="flex flex-col items-center justify-center h-min-10 hover:bg-neutral-700 drop-shadow-2xl rounded-lg w-full transition-all gap-y-3 text-white border-neutral-700 border py-3">
                        <Flame className={`${hasPracticedToday ? "text-orange-400" : "text-white"}`} />
                        <>{streakCnt} {streakCnt === 1 ? "dag" : "dagen"} reeks</>
                    </div>
                    <div className="flex flex-col items-center justify-center h-min-10 hover:bg-neutral-700 drop-shadow-2xl rounded-lg w-full gap-y-3 text-white border-neutral-700 border py-3 transition-all">
                        <Snowflake className={`${freezeCnt >= 1 ? "text-sky-400" : "text-white"}`} />
                        <>{freezeCnt} {freezeCnt === 1 ? "bevriezer" : "bevriezers"}</>
                    </div>
                </div>
                <div className="flex flex-col space-y-2">
                    <div className="text-sm text-center">Activiteit afgelopen week</div>
                    <div className="flex flex-row items-center justify-center h-min-10 space-x-3 rounded-lg p-3">
                        {weekActivity.map((day, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div className="text-xs mb-1">{formatDate(day.date)}</div>
                                <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center hover:bg-neutral-600 hover:drop-shadow-2xl transition-all">
                                    {getStatusIcon(day)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-row justify-center space-x-4 text-xs text-gray-300">
                        <div className="flex items-center space-x-1">
                            <Check className="text-green-400" size={14} />
                            <span>Geleerd</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Snowflake className="text-blue-400" size={14} />
                            <span>Bevroren</span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <X className="text-red-400" size={14} />
                            <span>Gemist</span>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
