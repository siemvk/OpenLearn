"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Button1 from "@/components/button/Button1";

interface DeleteSessionButtonProps {
  sessionId: string;
  listId: string;
  mode: string;
}

export default function DeleteSessionButton({ sessionId }: DeleteSessionButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    setShowConfirmDialog(false);
    setIsDeleting(true);
    try {
      const url = `/api/v1/session/${sessionId}`;
      console.log('Deleting session with URL:', url);
      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the page to update the list
        router.refresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to delete session:', response.status, errorData);
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

  return (
    <>
      <button
        onClick={handleDeleteClick}
        disabled={isDeleting}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
        title="Sessie verwijderen"
      >
        <Trash2 className="h-5 w-5 text-red-400" />
      </button>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-neutral-800 text-white border-neutral-700">
          <DialogHeader>
            <DialogTitle>Sessie verwijderen</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Weet je zeker dat je deze sessie wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button1
              text="Annuleren"
              onClick={() => setShowConfirmDialog(false)}
            />
            <Button1
              text="Verwijderen"
              onClick={handleConfirmDelete}
              icon={<Trash2 className="text-red-500" />}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="bg-neutral-800 text-white border-neutral-700">
          <DialogHeader>
            <DialogTitle>Fout</DialogTitle>
            <DialogDescription className="text-neutral-400">
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
