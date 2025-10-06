"use client"

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "./ui/dialog";
import Button1 from "./button/Button1";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA"
];

// Global variables to prevent multiple instances
let globalSequence: string[] = [];
let globalLastActivation = 0;
let globalListenerAttached = false;

export default function EasterEgg() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    // Prevent multiple event listeners from being attached
    if (globalListenerAttached) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.code;
      const now = Date.now();

      globalSequence = [...globalSequence, key];

      // Keep only the last 10 keys (length of Konami code)
      if (globalSequence.length > KONAMI_CODE.length) {
        globalSequence.shift();
      }

      // Kijken of de huidige sequentie overeenkomt met de Konami-code
      if (globalSequence.length === KONAMI_CODE.length) {
        const isMatch = globalSequence.every((keyCode: string, index: number) =>
          keyCode === KONAMI_CODE[index]
        );

        if (isMatch) {
          // Meerdere activaties binnen 3 seconden voorkomen
          if (now - globalLastActivation < 3000) {
            globalSequence = [];
            return;
          }

          globalLastActivation = now;

          setOpen(true);

          globalSequence = []; // Sequentie resetten zodat het opnieuw geactiveerd kan worden
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    globalListenerAttached = true;

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      globalListenerAttached = false;
    };
  }, []);

  return (

    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Damn!</DialogTitle>
          <DialogFooter>
            <Button1 text="Sluiten" onClick={() => setOpen(false)} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}