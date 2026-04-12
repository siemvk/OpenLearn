import type { Route } from "./+types/forum";
import { caller } from '~/utils/trpc/server'
import { auth } from '~/utils/auth/server'
import { Button } from "~/components/button/button";
import { ListContainer, ListItem } from "~/components/list/list";
import { getSubjectBySlug, TaalSlugEnum } from "~/components/Icons";
import { Form, redirect } from "react-router";

export async function action(actionArgs: Route.ActionArgs) {
    const formData = await actionArgs.request.formData();
    const itemId = formData.get("itemId");
    const itemType = formData.get("itemType");
    const intent = formData.get("intent");

    if (typeof itemId !== "string" || typeof itemType !== "string" || typeof intent !== "string") {
        return redirect('/admin/forum');
    }

    const api = await caller(actionArgs);

    if (intent === 'remove') {
        await api.forum.delete({ type: itemType === 'REPLY' ? 'REPLY' : 'POST', id: itemId });
    }

    if (intent === 'approve') {
        await api.forum.forumReviewApprove({ type: itemType === 'REPLY' ? 'REPLY' : 'POST', id: itemId });
    }

    return redirect('/admin/forum');
}

export async function loader(loaderArgs: Route.LoaderArgs) {
    const api = await caller(loaderArgs);
    const headers = new Headers(loaderArgs.request.headers)
    const result = await auth.api.getSession({ headers })
    const user = result?.user
    const forumPosts = await api.forum.forumReviewQueue();
    const forumReplies = await api.forum.forumReplyReviewQueue();
    return { forumPosts, forumReplies, user: user };
}

export default function ForumHome({ loaderData: { forumPosts, forumReplies, user: user } }: Route.ComponentProps) {
    return (
        <div className='flex flex-col items-center justify-center w-full p-0 m-0'>
            <h1 className="scale-150 text-xl font-bold">Forum</h1>
            <h2 className="w-full max-w text-lg font-semibold mt-8 mb-2">Pending Posts</h2>
            <ListContainer className="w-full max-w">
                {forumPosts?.map((post) => (
                    <ListItem image={getSubjectBySlug(post.subject as TaalSlugEnum)?.icon} key={post.id} linkTo={`/app/forum/${post.id}`} title={post.title} subtitle={`By ${post.author.name} on ${new Date(post.createdAt).toLocaleDateString()}`}>
                        <div className="flex flex-row flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                            <Form method="post">
                                <input type="hidden" name="itemId" value={post.id} />
                                <input type="hidden" name="itemType" value="POST" />
                                <Button type="submit" name="intent" value="remove">Remove</Button>
                            </Form>
                            <Form method="post">
                                <input type="hidden" name="itemId" value={post.id} />
                                <input type="hidden" name="itemType" value="POST" />
                                <Button type="submit" name="intent" value="approve">Approve</Button>
                            </Form>
                        </div>
                    </ListItem>
                ))}
            </ListContainer>
            <h2 className="w-full max-w text-lg font-semibold mt-8 mb-2">Pending Replies</h2>
            <ListContainer className="w-full max-w">
                {forumReplies?.map((reply) => (
                    <ListItem
                        key={reply.id}
                        linkTo={`/app/forum/${reply.post.id}`}
                        title={reply.content.length > 80 ? `${reply.content.slice(0, 80)}...` : reply.content}
                        subtitle={`By ${reply.author.name} on ${new Date(reply.createdAt).toLocaleDateString()} in ${reply.post.title}`}
                    >
                        <div className="flex flex-row flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                            <Form method="post">
                                <input type="hidden" name="itemId" value={reply.id} />
                                <input type="hidden" name="itemType" value="REPLY" />
                                <Button type="submit" name="intent" value="remove">Remove</Button>
                            </Form>
                            <Form method="post">
                                <input type="hidden" name="itemId" value={reply.id} />
                                <input type="hidden" name="itemType" value="REPLY" />
                                <Button type="submit" name="intent" value="approve">Approve</Button>
                            </Form>
                        </div>
                    </ListItem>
                ))}
            </ListContainer>
        </div>
    )
}
