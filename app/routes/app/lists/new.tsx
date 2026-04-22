import { useTRPC } from "~/utils/trpc/react";
import type { Route } from "./+types/new";
import { useMutation } from "@tanstack/react-query";
import { Button } from "~/components/button/button";
import { caller } from "~/utils/trpc/server.server";
import { useState } from "react";
import { useNavigate } from "react-router";
export async function loader(loaderArgs: Route.LoaderArgs) {
    let listId = loaderArgs.params.listId;
    let listData = null;
    if (listId == "new") {
        listId = crypto.randomUUID();
    }

    const api = await caller(loaderArgs);
    const result = await api.learn.getList({ id: listId });
    if (result) {
        listData = result;
    } else {
        listData = {
            id: listId,
            name: "",
            language: "nl",
            toLanguage: "en",
            fromLanguage: "nl",
            ownerId: "this-value-is-not-used",
            listItems: []
        }
    }

    return {
        listId: listId,
        listData: listData
    }
}

export default function newList({ loaderData }: Route.ComponentProps) {
    const trpc = useTRPC();

    const [listData, setListData] = useState(loaderData.listData);
    const nav = useNavigate();

    const submitMutation = useMutation({
        ...trpc.learn.upsertList.mutationOptions(),
        onSuccess: (data) => {
            // nu gaan we naar de viewer van de lijst die we net gemaakt hebben
            nav(`/app/list/${data.id}`);
        }
    });

    const handleSave = () => {
        submitMutation.mutate({
            id: listData.id,
            name: listData.name,
            language: listData.language as any,
            fromLanguage: ("fromLanguage" in listData ? listData.fromLanguage : "nl") as any,
            toLanguage: ("toLanguage" in listData ? listData.toLanguage : "en") as any,
            list: listData.listItems.map(({ vraag, antwoord }) => ({
                vraag,
                antwoord,
            })),
        });
    };

    return (
        <div>
            <label>
                Name
                <input
                    type="text"
                    value={listData.name}
                    onChange={(e) =>
                        setListData((current) => ({
                            ...current,
                            name: e.target.value,
                        }))
                    }
                />
            </label>
            <div className="flex flex-row">


            </div>

            <Button onClick={handleSave}>Save</Button>
        </div>
    );
}