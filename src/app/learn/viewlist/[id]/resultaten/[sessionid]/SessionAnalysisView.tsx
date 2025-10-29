'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, BarChart3, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Button1 from "@/components/button/Button1";
import { createCustomSession } from "@/utils/createCustomSession";
import { useState } from "react";

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
  subject?: string | null;
  lang_from?: string | null;
  lang_to?: string | null;
}

interface SessionAnalysisViewProps {
  session: Session;
  listName: string;
  listId: string;
}

interface WordStats {
  word: string;
  answer: string;
  wrongCount: number;
  correctCount: number;
  userAnswers: string[];
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

export default function SessionAnalysisView({ session, listName, listId }: SessionAnalysisViewProps) {
  const router = useRouter();
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Calculate basic statistics
  const correct = session.score?.correct || 0;
  const wrong = session.score?.wrong || 0;
  const total = correct + wrong;
  const percentage = total > 0 ? (correct / total) * 100 : 0;

  // Analyze word statistics from the session
  const wordStatsMap = new Map<string, WordStats>();

  // Process answer log
  if (Array.isArray(session.answerLog)) {
    session.answerLog.forEach((entry: any) => {
      const question = entry.word?.["1"] || '';
      const correctAnswer = entry.word?.["2"] || entry.correctAnswer || '';
      const key = `${question}|||${correctAnswer}`;
      const existing = wordStatsMap.get(key);

      if (existing) {
        if (entry.isCorrect) {
          existing.correctCount++;
        } else {
          existing.wrongCount++;
          if (entry.userAnswer) {
            existing.userAnswers.push(entry.userAnswer);
          }
        }
      } else {
        wordStatsMap.set(key, {
          word: question,
          answer: correctAnswer,
          wrongCount: entry.isCorrect ? 0 : 1,
          correctCount: entry.isCorrect ? 1 : 0,
          userAnswers: entry.isCorrect ? [] : (entry.userAnswer ? [entry.userAnswer] : [])
        });
      }
    });
  }

  // Process incorrect answer log
  if (Array.isArray(session.incorrectAnswerLog)) {
    session.incorrectAnswerLog.forEach((entry: any) => {
      const question = entry.word?.["1"] || '';
      const correctAnswer = entry.word?.["2"] || entry.correctAnswer || '';
      const key = `${question}|||${correctAnswer}`;
      const existing = wordStatsMap.get(key);

      if (existing) {
        existing.wrongCount++;
        if (entry.userAnswer) {
          existing.userAnswers.push(entry.userAnswer);
        }
      } else {
        wordStatsMap.set(key, {
          word: question,
          answer: correctAnswer,
          wrongCount: 1,
          correctCount: 0,
          userAnswers: entry.userAnswer ? [entry.userAnswer] : []
        });
      }
    });
  }

  // Sort words by wrong count (most wrong first)
  const wordStats = Array.from(wordStatsMap.values())
    .sort((a, b) => b.wrongCount - a.wrongCount);

  const wrongWords = wordStats.filter(w => w.wrongCount > 0);
  const correctWords = wordStats.filter(w => w.correctCount > 0 && w.wrongCount === 0);

  // Handler to create a custom session with wrong words
  const handlePracticeWrongWords = async () => {
    if (wrongWords.length === 0) return;

    setIsCreatingSession(true);

    try {
      // Transform wrongWords back into the format needed for the session
      const wordsToReview = wrongWords.map((stat, index) => ({
        "1": stat.word,
        "2": stat.answer,
        id: index
      }));

      const response = await createCustomSession({
        words: wordsToReview,
        subject: session.subject || 'CUSTOM',
        lang_from: session.lang_from || 'NL',
        lang_to: session.lang_to || 'NL',
        mode: 'learnlist', // Default to test mode
        method: 'learnlist'
      });

      // Navigate to the custom session
      router.push(`/learn/session/${response.sessionId}`);
    } catch (error) {
      console.error('Failed to create practice session:', error);
      alert('Er ging iets mis bij het maken van de oefensessie. Probeer het opnieuw.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(`/learn/viewlist/${listId}/resultaten`)}
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{modeDisplayNames[session.mode] || session.mode}</h1>
          <p className="text-neutral-400">{listName}</p>
        </div>
      </div>

      {/* Date */}
      <p className="text-sm text-neutral-400">
        Voltooid om {new Date(session.createdAt).toLocaleDateString('nl-NL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>

      {/* Overall Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Cijfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {session.grade !== null ? (
                <>
                  <div className="text-3xl font-bold">{session.grade.toFixed(1)}</div>
                  <Award className="h-8 w-8 text-yellow-500" />
                </>
              ) : (
                <div className="text-lg text-neutral-500">Geen cijfer</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{percentage.toFixed(0)}%</div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {correct} / {total} correct
            </p>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Goed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-500">{correct}</div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-400">Fout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-500">{wrong}</div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wrong Words */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Fout beantwoorde woorden ({wrongWords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wrongWords.length > 0 ? (
              <div className="space-y-4">
                {wrongWords.map((stat, idx) => (
                  <div key={idx} className="border-b border-neutral-700 pb-3 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="text-xs text-neutral-400 mb-1">Vraag:</div>
                        <div className="font-medium text-lg mb-2">{stat.word}</div>
                        <div className="text-xs text-neutral-400 mb-1">Correct antwoord:</div>
                        <div className="text-sm text-green-400 font-semibold">{stat.answer}</div>
                      </div>
                      <Badge variant="destructive" className="ml-2">
                        {stat.wrongCount}× fout
                      </Badge>
                    </div>
                    {stat.userAnswers.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs text-neutral-400 mb-1">Jouw antwoorden:</div>
                        <div className="flex flex-wrap gap-2">
                          {stat.userAnswers.map((ans, i) => (
                            <Badge key={i} variant="outline" className="border-red-500 text-red-400">
                              {ans}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {stat.correctCount > 0 && (
                      <div className="text-xs text-green-400 mt-2">
                        ✓ Ook {stat.correctCount}× goed beantwoord
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-neutral-400 text-center py-4">
                Geen fouten gemaakt! 🎉
              </p>
            )}
          </CardContent>
        </Card>

        {/* Correct Words */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Perfect beantwoord ({correctWords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {correctWords.length > 0 ? (
              <div className="space-y-3">
                {correctWords.slice(0, 10).map((stat, idx) => (
                  <div key={idx} className="border-b border-neutral-700 pb-2 last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-xs text-neutral-400 mb-1">Vraag:</div>
                        <div className="font-medium mb-1">{stat.word}</div>
                        <div className="text-sm text-green-400">{stat.answer}</div>
                      </div>
                      <Badge variant="outline" className="ml-2 border-green-500 text-green-400">
                        {stat.correctCount}× goed
                      </Badge>
                    </div>
                  </div>
                ))}
                {correctWords.length > 10 && (
                  <p className="text-xs text-neutral-400 text-center pt-2">
                    + {correctWords.length - 10} meer...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-neutral-400 text-center py-4">
                Geen perfect beantwoorde woorden
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Improvement Tips */}
      {wrongWords.length > 0 && (
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Tips voor verbetering
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-neutral-300">
              <li>Focus op de {wrongWords.length} {wrongWords.length === 1 ? "woord" : "woorden"} die je fout had</li>
              <li>Oefen deze woorden nog eens apart met de "Leren" modus</li>
              {percentage < 60 && (
                <li>Probeer de lijst eerst door te nemen voordat je oefent</li>
              )}
              {wrongWords.some(w => w.wrongCount > 1) && (
                <li>Let extra op woorden die je meerdere keren fout had</li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Practice Wrong Words Button */}


      {/* Action buttons */}
      <div className="flex gap-4 justify-center pt-4">
        <Button1
          text="Terug naar resultaten"
          onClick={() => router.push(`/learn/viewlist/${listId}/resultaten`)}
        />
        <Button1
          text="Opnieuw oefenen"
          onClick={() => router.push(`/learn/${session.mode}/${listId}`)}
        />
        {wrongWords.length > 0 && (
          <Button1
            text={isCreatingSession ? "Bezig..." : "Foute woorden herhalen"}
            onClick={handlePracticeWrongWords}
            disabled={isCreatingSession}
          />
        )}
      </div>
    </div>
  );
}
