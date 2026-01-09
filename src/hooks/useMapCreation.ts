"use client";
import { useState, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

// Define form validation schema with Zod
const mapFormSchema = z.object({
  name: z
    .string()
    .min(1, "Mapnaam is verplicht")
    .max(50, "Mapnaam mag maximaal 50 karakters bevatten"),
  isPublic: z.boolean(),
}).required({
  isPublic: true,
});

export type MapFormValues = z.infer<typeof mapFormSchema>;

export function useMapCreation() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<MapFormValues>({
    resolver: zodResolver(mapFormSchema),
    defaultValues: {
      name: "",
      isPublic: false,
    },
  });

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setDialogOpen(isOpen);
    if (!isOpen) {
      form.reset();
    }
  }, [form]);

  const onSubmit = useCallback(async (values: MapFormValues) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/map/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          isPublic: values.isPublic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Network error" }));
        throw new Error(errorData.error || "Failed to create map");
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Map met succes gemaakt!");
        setDialogOpen(false);
        form.reset();
        router.push(`/learn/map/${result.mapId}`);
      } else {
        toast.error(result.error || "Map maken is mislukt met onbekende fout", {
          position: "top-right",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [form, router]);

  return {
    dialogOpen,
    isSubmitting,
    form,
    handleOpenDialog,
    handleOpenChange,
    onSubmit
  };
}
