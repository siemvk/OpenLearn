// TODO: dit herdoen!! we gebruiken nu geen trpc en doen een reload om niewe data te laden maar dat kan netter.

import { Form, useNavigate } from "react-router";
import { Button } from "~/components/button/button";
import type { Route } from "./+types/betaUiLinker";
import { caller } from "~/utils/trpc/server.server";
import { ListContainer, ListItem } from "~/components/list/list";
import { Pencil, Trash } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/utils/trpc/react";
import { getSubjectBySlug, taalSlugsList } from "~/components/Icons";


export async function loader(request: Route.LoaderArgs) {
    const api = await caller(request);

    return await api.learn.getUserLists();
}

export default function Component({ loaderData }: Route.ComponentProps) {
    const nav = useNavigate();
    const redirector = useNavigate();
    const trpc = useTRPC();
    const deleteMutation = useMutation(trpc.learn.removeList.mutationOptions({
        onSuccess: () => {
            redirector("/app/list/beta");
        }
    }))
    return (
        <div className="flex flex-col justify-center gap-4 items-center mx-4">
            <h1 className="text-3xl font-bold">Temp UI!!</h1>
            <p>I have not yet had the time to implement nice desings! (I am more of a backend guy)</p>
            <p>STUFF WILL LOOK VERY BAD!!!</p>
            <Button onClick={() => { redirector("/app/list/new/new") }}>New post</Button>

            <h1 className="text-3xl font-bold">My lists</h1>
            <ListContainer className="">
                {loaderData.map((list) => (
                    <ListItem key={list.id} title={list.name} linkTo={"/app/list/" + list.id} subtitle={list.listItems.length + " items"} image={getSubjectBySlug(list.language)?.icon}>
                        <Button onClick={() => { nav("/app/list/new/" + list.id) }}><Pencil /></Button>
                        <Button onClick={() => { deleteMutation.mutate({ id: list.id }) }}><Trash /></Button>
                    </ListItem>
                ))}
            </ListContainer>
        </div>
    );
}