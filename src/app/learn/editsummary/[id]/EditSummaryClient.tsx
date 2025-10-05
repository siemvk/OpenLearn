"use client";

import { Textarea } from "@/components/ui/textarea";
import { useState, useRef, ReactNode, useEffect, useCallback } from "react";
import Dropdown, { DropdownHandle } from "@/components/button/DropdownBtn";
import { defaultItems } from "@/components/icons";
import { saveSummary, publishSummary } from "@/serverActions/summaryActions";
import { toast } from "react-toastify";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { Input } from "@/components/ui/input";
import Button1 from "@/components/button/Button1";
import Link from "next/link";
import { X } from "lucide-react";
import { useUserDataStore } from "@/store/user/UserDataProvider";
import Tabs from "@/components/Tabs";
import MarkdownRenderer from "@/components/md";

interface EditSummaryClientProps {
  summaryId: string;
  initialName: string;
  initialContent: string;
  initialSubjectId?: string;
  initialPublished: boolean;
  initialLastSaved: string | null;
  creatorId?: string;
}

export default function EditSummaryClient({
  summaryId,
  initialName,
  initialContent,
  initialSubjectId,
  initialPublished,
  initialLastSaved,
  creatorId,
}: EditSummaryClientProps) {
  // Get user data from the store
  const userStore = useUserDataStore();
  const isAdmin = userStore.getState().isAdmin;
  const userId = userStore.getState().id;

  // Check if admin is editing someone else's summary
  const isEditingOthersSummary = isAdmin && creatorId && creatorId !== userId;

  // Tab state
  const [activeTab, setActiveTab] = useState<string>("write");

  const [selectedSubject, setSelectedSubject] = useState<{ id: string; display: ReactNode } | undefined>(
    initialSubjectId ? { id: initialSubjectId, display: defaultItems.find(item => item.value === initialSubjectId)?.label || initialSubjectId } : undefined
  );
  const subjectDropdownRef = useRef<DropdownHandle>(null);
  const [summaryName, setSummaryName] = useState(initialName);
  const [summaryContent, setSummaryContent] = useState(initialContent);
  const [autosavedSummaryId, setAutosavedSummaryId] = useState<string | undefined>(summaryId);
  const [lastSaved, setLastSaved] = useState<Date | null>(initialLastSaved ? new Date(initialLastSaved) : null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [isPublishing, setIsPublishing] = useState(false);
  const debouncedSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State for last autosaved values
  const [lastAutosavedName, setLastAutosavedName] = useState<string>(initialName);
  const [lastAutosavedContent, setLastAutosavedContent] = useState<string>(initialContent);
  const [lastAutosavedSubjectId, setLastAutosavedSubjectId] = useState<string | undefined>(initialSubjectId);

  const subjectEntries: [React.ReactNode, string][] = defaultItems.map(item => [item.label, item.value]);

  const handleAutosave = useCallback(async (currentContent: string, currentName: string, currentSubjectId?: string) => {
    if (!currentSubjectId) {
      if (!autosavedSummaryId) return;
    }
    if (isSaving) return;

    setIsSaving(true);
    try {
      const result = await saveSummary({
        id: autosavedSummaryId,
        name: currentName,
        subjectId: currentSubjectId || selectedSubject?.id || "",
        content: currentContent,
        autosave: true,
      });

      if (result.id) {
        setAutosavedSummaryId(result.id);
        if (result.lastSaved) {
          setLastSaved(new Date(result.lastSaved));
        }
        setLastAutosavedName(currentName);
        setLastAutosavedContent(currentContent);
        setLastAutosavedSubjectId(currentSubjectId || selectedSubject?.id || undefined);
      }
    } catch (error) {
      // Optionally handle error
    } finally {
      setIsSaving(false);
    }
  }, [autosavedSummaryId, selectedSubject, isSaving]);

  useEffect(() => {
    if (debouncedSaveTimeoutRef.current) {
      clearTimeout(debouncedSaveTimeoutRef.current);
    }

    const currentSubjectId = selectedSubject?.id;
    const hasChanges = summaryName !== lastAutosavedName ||
      summaryContent !== lastAutosavedContent ||
      currentSubjectId !== lastAutosavedSubjectId;

    if (hasChanges && (currentSubjectId || autosavedSummaryId)) {
      debouncedSaveTimeoutRef.current = setTimeout(() => {
        handleAutosave(summaryContent, summaryName, currentSubjectId);
      }, 1500);
    }

    return () => {
      if (debouncedSaveTimeoutRef.current) {
        clearTimeout(debouncedSaveTimeoutRef.current);
      }
    };
  }, [summaryContent, summaryName, selectedSubject, handleAutosave, lastAutosavedName, lastAutosavedContent, lastAutosavedSubjectId, autosavedSummaryId]);

  const handleManualSave = async () => {
    if (!selectedSubject?.id) {
      toast.error("Selecteer een vak voordat je opslaat.");
      return;
    }
    if (!summaryContent.trim() && !summaryName.trim()) {
      toast.error("Geef een naam en schrijf wat inhoud voor je samenvatting voordat je opslaat.");
      return;
    }
    if (!summaryName.trim()) {
      toast.error("Geef een naam aan je samenvatting voordat je opslaat.");
      return;
    }
    if (!summaryContent.trim()) {
      toast.error("Schrijf wat inhoud voor je samenvatting voordat je opslaat.");
      return;
    }
    setIsSaving(true);
    try {
      const result = await saveSummary({
        id: autosavedSummaryId,
        name: summaryName,
        subjectId: selectedSubject.id,
        content: summaryContent,
        autosave: false,
      });

      if (result.id) {
        setAutosavedSummaryId(result.id);
        if (result.lastSaved) {
          setLastSaved(new Date(result.lastSaved));
        }
        toast.success(result.message || "Samenvatting opgeslagen!");
        window.location.href = `/learn/summary/${result.id}`;
      } else if (result.error) {
        toast.error(result.error);
      } else {
        toast.error("Er is een onbekende fout opgetreden bij het opslaan.");
      }
    } catch (error) {
      toast.error("Kon samenvatting niet opslaan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!autosavedSummaryId) {
      toast.error("Kan samenvatting niet publiceren: ID ontbreekt.");
      return;
    }
    if (isPublishing) return;

    setIsPublishing(true);
    try {
      const result = await publishSummary({ id: autosavedSummaryId });
      if (result.id && !result.error) {
        setIsPublished(true);
        setLastSaved(result.lastSaved ? new Date(result.lastSaved) : lastSaved);
        toast.success(result.message || "Samenvatting succesvol gepubliceerd!");
        window.location.href = `/learn/summary/${result.id}`;
      } else {
        toast.error(result.error || "Kon samenvatting niet publiceren.");
      }
    } catch (error) {
      toast.error("Er is een onbekende fout opgetreden bij het publiceren.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="px-2 pb-20">
      <Link
        href="/home/start"
        className="fixed top-4 right-4 z-[150] flex h-12 w-12 items-center justify-center rounded-full bg-neutral-700 transition-colors hover:bg-neutral-600 drop-shadow-2xl"
      >
        <X />
      </Link>
      <div className="w-full text-center py-2">
        <h1 className="font-extrabold text-4xl">Samenvatting Bewerken</h1>
        <div className="text-xs mt-1 h-4">
          {isSaving ? (
            <span className="text-blue-400">Bezig met opslaan...</span>
          ) : lastSaved ? (
            <span className="text-green-400">Laatst opgeslagen: {formatRelativeTime(lastSaved)}</span>
          ) : (
            <span>&nbsp;</span>
          )}
        </div>
      </div>

      {/* Summary Name Input */}
      <div className="my-4 flex justify-center">
        <Input
          type="text"
          placeholder="Naam van je samenvatting"
          value={summaryName}
          onChange={(e) => setSummaryName(e.target.value)}
          className="w-full max-w-md bg-neutral-800"
        />
      </div>

      {/* Subject Dropdown */}
      <div className="my-4 flex justify-center relative">
        <Dropdown
          ref={subjectDropdownRef}
          text={selectedSubject ? selectedSubject.display as string : "Selecteer een vak"}
          width={300}
          dropdownMatrix={subjectEntries}
          selectorMode={true}
          onChange={(selectedItem) => {
            setSelectedSubject(selectedItem);
          }}
        />
      </div>

      <div className="mt-16">
        <Tabs
          tabs={[
            {
              id: "write",
              label: "Schrijven",
              content: (
                <div>
                  <Textarea
                    className="border-neutral-600 resize-none h-[calc(100vh-340px)] text-xl"
                    placeholder="Schrijf hier je samenvatting..."
                    value={summaryContent}
                    onChange={(e) => setSummaryContent(e.target.value)}
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
              content: (
                <div className="bg-neutral-800 border border-neutral-700 h-[calc(100vh-340px)] overflow-y-auto p-4 rounded-md">
                  {summaryContent ? (
                    <MarkdownRenderer content={summaryContent} />
                  ) : (
                    <p className="text-gray-400">Voorbeeldweergave verschijnt hier...</p>
                  )}
                </div>
              ),
            },
          ]}
          defaultActiveTab="write"
          onTabChange={setActiveTab}
        />
      </div>
      <div className="mt-2 flex justify-between items-center">
        <div>
          <p className="text-gray-400 text-sm">
            Gebruik de tabs hierboven om te schrijven en een voorbeeld te bekijken. Markdown wordt ondersteund.
          </p>
        </div>
        <div className="flex space-x-2">
          {!isPublished && (
            <Button1
              onClick={handlePublish}
              disabled={isPublishing || isSaving || !autosavedSummaryId}
              text={isPublishing ? "Publiceren..." : "Publiceren"}
            />
          )}
          <Button1 onClick={handleManualSave} disabled={isSaving || !selectedSubject?.id || !summaryContent.trim() || !summaryName.trim()} text={"Opslaan"} />
        </div>
      </div>
    </div>
  );
}
