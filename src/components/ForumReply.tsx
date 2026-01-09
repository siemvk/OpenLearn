"use client"

import { useState, useCallback, memo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Button1 from "@/components/button/Button1"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"
import Tabs from "@/components/Tabs"
import MarkdownRenderer from "@/components/md"
import { useUniqueId } from "@dnd-kit/utilities"
import { useUserDataStore } from "@/store/user/UserDataProvider"

const MarkdownPreview = memo(({ content }: { content: string }) => (
  <div className="bg-neutral-800 border border-neutral-700 h-40 overflow-y-auto p-3 rounded-md prose prose-invert max-w-none whitespace-pre-line">
    {content ? (
      <MarkdownRenderer content={content} />
    ) : (
      <p className="text-gray-400">Voorbeeldweergave verschijnt hier...</p>
    )}
  </div>
));


interface ForumReplyProps {
  postId: string
  buttonText?: string
  userId: string
}

function ForumReply({ postId, userId }: ForumReplyProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const session = useUserDataStore()
  const isSignedIn = session.getState().id !== ""

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/v1/forum/replies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postId, content, userId }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setContent("")
        setOpen(false)
        toast.success("Je antwoord is succesvol geplaatst! Hiermee heb je 10 punten verdiend.")
        router.refresh()
      } else {
        toast.error(result.error || "Er is een fout opgetreden")
      }
    } catch (error) {
      console.error("Error creating reply:", error)
      toast.error("Er is iets misgegaan bij het versturen van je antwoord")
    } finally {
      setIsSubmitting(false)
    }
  }, [postId, content, userId, router])

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setContent("");
    }
  }, []);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  return (
    <>
      <Button1 onClick={() => setOpen(true)}
        text={isSignedIn ? "Beantwoorden" : "Log in om te beantwoorden"}
        disabled={!isSignedIn}
      />
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] z-110">
          <DialogHeader>
            <DialogTitle>Beantwoord deze post</DialogTitle>
            <DialogDescription>
              Deel je gedachten of antwoord op deze vraag.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs tabs={[
              {
                id: "write",
                label: "Schrijven",
                content: (
                  <div>
                    <Textarea
                      placeholder="Typ je antwoord hier... Markdown wordt ondersteund."
                      value={content}
                      onChange={handleContentChange}
                      className="min-h-[150px] resize-none bg-neutral-800 border-neutral-700 text-xl p-3"
                      required
                    />
                    <div className="text-sm mt-2 text-gray-400">
                      <p>Markdown tips:</p>
                      <p>**vetgedrukt**, *schuingedrukt*, [link](https://url.com)</p>
                      <p># Grote kop, ## Kleinere kop, ### Nog kleinere kop</p>
                    </div>
                  </div>
                ),
              },
              {
                id: "preview",
                label: "Voorbeeld",
                content: <MarkdownPreview content={content} />,
              },
            ]} defaultActiveTab="write" />

            <div className="flex justify-end space-x-2">
              <Button1
                type="submit"
                disabled={isSubmitting || !content.trim()}
                text={isSubmitting ? "Bezig..." : "Plaats antwoord"}
              />
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default memo(ForumReply);
