"use client"

import { useState, useEffect } from "react";
import Button1 from "@/components/button/Button1";
import { UserPlus, Clock, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

interface JoinGroupButtonProps {
    groupId: string;
    requiresApproval?: boolean;
    hasPendingRequest?: boolean;
}

export default function JoinGroupButton({
    groupId,
    requiresApproval = false,
    hasPendingRequest = false
}: JoinGroupButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isPending, setIsPending] = useState(hasPendingRequest);
    const router = useRouter();

    // If hasPendingRequest is not provided from the server, we can check on the client side
    useEffect(() => {
        if (hasPendingRequest) {
            setIsPending(true);
        }
    }, [hasPendingRequest]);

    const handleJoin = async () => {
        if (isPending) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/groups/${groupId}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                if (requiresApproval) {
                    setIsPending(true);
                }
                router.refresh();
            } else {
                toast.error(result.error || "Er is een fout opgetreden");
            }
        } catch (error) {
            console.error("Error joining group:", error);
            toast.error("Er is een fout opgetreden");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelRequest = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/groups/${groupId}/join`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                setIsPending(false);
                router.refresh();
            } else {
                toast.error(result.error || "Er is een fout opgetreden");
            }
        } catch (error) {
            console.error("Error canceling request:", error);
            toast.error("Er is een fout opgetreden");
        } finally {
            setIsLoading(false);
        }
    };

    if (isPending) {
        return (
            <div className="flex space-x-2">
                <Button1
                    onClick={() => { }}
                    disabled={true}
                    text="Wacht op goedkeuring"
                    icon={<Clock className="h-5 w-5 text-yellow-400" />}
                />
                <Button1
                    onClick={handleCancelRequest}
                    disabled={isLoading}
                    text={isLoading ? "Bezig..." : "Verzoek intrekken"}
                    icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-5 w-5" />}
                />
            </div>
        );
    }

    return (
        <Button1
            onClick={handleJoin}
            disabled={isLoading}
            text={
                isLoading
                    ? (requiresApproval ? "Verzoek verzenden..." : "Lid worden...")
                    : (requiresApproval ? "Lidmaatschap aanvragen" : "Lid worden")
            }
            icon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-5 w-5" />}
        />
    );
}
