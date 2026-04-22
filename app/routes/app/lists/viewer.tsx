import { caller } from "~/utils/trpc/server.server";
import type { Route } from "./+types/viewer";

export async function loader(loaderArgs: Route.LoaderArgs) {
    const api = await caller(loaderArgs);
    if (!loaderArgs.params.listId) {
        throw new Response("Not Found", { status: 404 });
    }
    const list = await api.learn.getList({ id: loaderArgs.params.listId! });
    if (!list) {
        throw new Response("Not Found", { status: 404 });
    }
    return list;
}

export default function Component({ loaderData }: Route.ComponentProps) {
    return (
        <div>
            <h1>{loaderData.name}</h1>
            <ul>
                {loaderData.listItems.map((item: any) => (
                    <li key={item.id}>
                        <strong>{item.vraag}</strong>: {item.antwoord}
                    </li>
                ))}
            </ul>
        </div>
    );
}