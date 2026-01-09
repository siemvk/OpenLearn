"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CalendarCog, ChartArea, Crown, Dna } from "lucide-react";

export const prestatieMap = [
  {
    points: 10, name: "placeholder",
    description: "placeholder",
    image: (
      <>
        <CalendarCog className="w-30 h-30" />
      </>
  ) },
  {
    points: 100,
    name: "placeholder",
    description: "placeholder",
    image: (
      <>
        <Crown className="w-30 h-30" />
      </>
    ),
  },
  {
    points: 1000,
    name: "placeholder",
    description: "placeholder",
    image: (
      <>
        <Dna className="w-30 h-30" />
      </>
    ),
  },
  {
    points: 5000,
    name: "placeholder",
    description: "placeholder",
    image: (
      <>
        <ChartArea className="w-30 h-30" />
      </>
    ),
  },
];

export function PrestatieSelector({ points }: { points: number }) {
  return (
    <Card className="mb-6 bg-neutral-800 text-white border-neutral-700">
      <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {prestatieMap.map((prestatie, i) => {
          const disabled = points < prestatie.points;
          return (
            <div
              key={i}
              className={`transition-all flex flex-col items-center justify-center text-center p-3 rounded-md min-h-[120px] ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-neutral-900/50 hover:text-neutral-300 cursor-pointer active:scale-95"
              }`}
            >
              <div className="mb-2 flex items-center justify-center [&>svg]:w-8 [&>svg]:h-8 sm:[&>svg]:w-12 sm:[&>svg]:h-12 md:[&>svg]:w-16 md:[&>svg]:h-16">
                {prestatie.image}
              </div>
              <h1 className="text-sm sm:text-base md:text-lg font-medium">{prestatie.name}</h1>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1">{prestatie.description}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
