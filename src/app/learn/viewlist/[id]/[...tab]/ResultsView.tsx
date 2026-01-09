'use client';

import { Card } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import { formatRelativeTime } from '@/utils/formatRelativeTime';
import { ChevronRight } from 'lucide-react';

interface Session {
  id: string;
  sessionId: string;
  mode: string;
  score: any;
  grade: number | null;
  answerLog: any;
  incorrectAnswerLog: any;
  originalWordCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ResultsViewProps {
  sessions: Session[];
  listId: string;
}

// Map mode names to Dutch display names
const modeDisplayNames: Record<string, string> = {
  'test': 'Toets',
  'hints': 'Hints',
  'learnlist': 'Leren',
  'multichoice': 'Meerkeuze',
  'mind': 'In gedachten',
  'livequiz': 'LiveQuiz'
};

export default function ResultsView({ sessions, listId }: ResultsViewProps) {
  const router = useRouter();

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-neutral-300 mb-2">Nog geen resultaten</h3>
        <p className="text-neutral-400">
          Voltooi een oefensessie om je resultaten hier te zien
        </p>
      </div>
    );
  }

  const handleSessionClick = (sessionId: string) => {
    router.push(`/learn/viewlist/${listId}/resultaten/${sessionId}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Resultaten</h2>
        <p className="text-neutral-400 text-sm mt-1">
          {sessions.length} voltooide sessie{sessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid gap-4">
        {sessions.map((session) => {
          const correct = session.score?.correct || 0;
          const wrong = session.score?.wrong || 0;
          const total = correct + wrong;
          const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

          return (
            <Card
              key={session.id}
              className="p-6 cursor-pointer hover:bg-neutral-800/50 transition-colors group"
              onClick={() => handleSessionClick(session.sessionId)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">
                      {modeDisplayNames[session.mode] || session.mode}
                    </h3>
                    <ChevronRight className="h-5 w-5 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
                  </div>
                  <p className="text-sm text-neutral-400 mt-1">
                    {formatRelativeTime(new Date(session.createdAt))}
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-green-500 font-medium">{correct} goed</span>
                      <span className="text-neutral-500 mx-2">•</span>
                      <span className="text-red-500 font-medium">{wrong} fout</span>
                    </div>
                    <div className="text-sm text-neutral-400">
                      {percentage}% correct
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  {session.grade !== null ? (
                    <>
                      <div className="text-3xl font-bold">{session.grade.toFixed(1)}</div>
                      <p className="text-xs text-neutral-400 mt-1">Cijfer</p>
                    </>
                  ) : (
                    <div className="text-sm text-neutral-500">Geen cijfer</div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
