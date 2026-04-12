import type { Route } from "./+types/forum";
import { caller } from '~/utils/trpc/server'
import { auth } from '~/utils/auth/server'
import { Button } from "~/components/button/button";
import { ListContainer, ListItem } from "~/components/list/list";
import { getSubjectBySlug, TaalSlugEnum } from "~/components/Icons";
import { Form, redirect } from "react-router";

export async function action(actionArgs: Route.ActionArgs) {
    const formData = await actionArgs.request.formData();
    const postId = formData.get("postId");
    const intent = formData.get("intent");

    if (typeof postId !== "string" || typeof intent !== "string") {
        return redirect('/admin/forum');
    }

    const api = await caller(actionArgs);

    if (intent === 'remove') {
        await api.forum.delete({ type: 'POST', id: postId });
    }

    if (intent === 'approve') {
        await api.forum.forumReviewApprove({ postId });
    }

    return redirect('/admin/forum');
}

export async function loader(loaderArgs: Route.LoaderArgs) {
    const api = await caller(loaderArgs);
    const headers = new Headers(loaderArgs.request.headers)
    const result = await auth.api.getSession({ headers })
    const user = result?.user
    const forumPosts = await api.forum.forumReviewQueue();
    return { forum: forumPosts, user: user };
}

export default function ForumHome({ loaderData: { forum: forumPosts, user: user } }: Route.ComponentProps) {
    return (
        <div className='flex flex-col items-center justify-center w-full p-0 m-0'>
            <h1 className="scale-150 text-xl font-bold">Forum</h1>
            <ListContainer className="w-full max-w">
                {forumPosts?.map((post) => (
                    <ListItem image={getSubjectBySlug(post.subject as TaalSlugEnum)?.icon} key={post.id} linkTo={`/app/forum/${post.id}`} title={post.title} subtitle={`By ${post.author.name} on ${new Date(post.createdAt).toLocaleDateString()}`}>
                        <div className="flex flex-row flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
                            <Form method="post">
                                <input type="hidden" name="postId" value={post.id} />
                                <Button type="submit" name="intent" value="remove">Remove</Button>
                            </Form>
                            <Form method="post">
                                <input type="hidden" name="postId" value={post.id} />
                                <Button type="submit" name="intent" value="approve">Approve</Button>
                            </Form>
                        </div>
                    </ListItem>
                ))}
            </ListContainer>
        </div>
    )
}
