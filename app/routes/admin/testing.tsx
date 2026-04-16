import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Button } from "~/components/button/button";
import { authClient } from "~/utils/auth/client";
import { useTRPC } from "~/utils/trpc/react";


export default function Component() {
    const trpc = useTRPC();
    const navigate = useNavigate();

    const nukeForum = useMutation(trpc.forum.nukeForum.mutationOptions());
    return (
        <div className="flex flex-col items-center gap-4">
            <h1 className="font-bold " >Testing helper.</h1>
            <Button onClick={() => {
                authClient.signOut().then(() => {
                    navigate("/")
                })
            }}>
                logout session
            </Button>

            <Button onClick={() => nukeForum.mutate()}>
                NUKE FORUM!!!
            </Button>
        </div>
    );
}