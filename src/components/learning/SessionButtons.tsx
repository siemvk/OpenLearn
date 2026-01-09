"use client";

import { useRouter } from "next/navigation";
import Button1 from "@/components/button/Button1";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, Trash } from "lucide-react";

interface SessionButtonsProps {
  listId: string;
  sessions: { mode: string; lastActiveAt: Date }[];
}

export default function SessionButtons({ listId, sessions }: SessionButtonsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Get the most recent session
  const latestSession = sessions[0];

  if (!latestSession) {
    return null;
  }

  const handleResume = () => {
    // Navigate to the learning page with the session's mode
    router.push(`/learn/${latestSession.mode}/${listId}`);
  };

  const handleDeleteClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    setShowConfirmDialog(false);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/lists/${listId}/session?mode=${latestSession.mode}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the page to show the dropdown again
        router.refresh();
      } else {
        console.error('Failed to delete session');
        setErrorMessage('Er is iets misgegaan bij het verwijderen van de sessie');
        setShowErrorDialog(true);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setErrorMessage('Er is iets misgegaan bij het verwijderen van de sessie');
      setShowErrorDialog(true);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format the mode name for display
  const getModeDisplayName = (mode: string) => {
    const modeNames: Record<string, string> = {
      learnlist: 'Leren',
      test: 'Toets',
      hints: 'Hints',
      mind: 'In gedachten',
      multichoice: 'Meerkeuze'
    };
    return modeNames[mode] || mode;
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-neutral-300">
          Je hebt een actieve sessie voor <strong className="text-white">{getModeDisplayName(latestSession.mode)}</strong>
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button1
            text="Sessie hervatten"
            onClick={handleResume}
            icon={<Play />}
          />
          <Button1
            text={isDeleting ? "Verwijderen..." : "Sessie verwijderen"}
            onClick={handleDeleteClick}
            disabled={isDeleting}
            icon={<Trash className="text-red-500"/>}
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sessie verwijderen?</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze sessie wilt verwijderen? Je voortgang gaat verloren.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button1
              text="Annuleren"
              onClick={() => setShowConfirmDialog(false)}
            />
            <Button1
              text="Verwijderen"
              onClick={handleConfirmDelete}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fout</DialogTitle>
            <DialogDescription>
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button1
              text="Sluiten"
              onClick={() => setShowErrorDialog(false)}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
