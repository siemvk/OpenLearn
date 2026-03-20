import type { Route } from "./+types/viewpost";
import { caller } from '~/utils/trpc/server'
import { redirect, Form } from 'react-router'
import { useNavigate } from "react-router";
import { useState } from "react";
// prisma types importen is zo lelijk
import type { forumVoteModel } from "~/../generated/prisma/models"
// bestaat deze forumVoteModel uberhaupt nog in openlearn?? :sob:

export async function loader(loaderArgs: Route.LoaderArgs) {
    const api = await caller(loaderArgs)
    try {
        const user = await api.forum.getSpecificPost({ postId: loaderArgs.params.postId! })
        if (!user) {
            return redirect('/app/forum')
        }
        return user
    } catch (error) {
        return redirect('/app/forum')
    }
}

export async function action(actionArgs: Route.ActionArgs) {
    const formData = await actionArgs.request.formData();
    const intent = formData.get('intent') as string;
    const postId = actionArgs.params.postId as string;

    const api = await caller(actionArgs);

    if (intent === 'reply') {
        const content = formData.get('content') as string;
        await api.forum.replyToPost({ postId, content });
    } else if (intent === 'upvote' || intent === 'downvote') {
        const vote = intent === 'upvote' ? 'UPVOTE' : 'DOWNVOTE';
        await api.forum.votePost({ postId, vote });
    }

    return redirect(`/app/forum/${postId}`);
}
function countVotes(votes: forumVoteModel[]) {
    let count = 0;
    votes.forEach((vote) => {
        if (vote.vote === 'UPVOTE') {
            count += 1;
        } else if (vote.vote === 'DOWNVOTE') {
            count -= 1;
        } else {
            console.warn('wat de hell');
        }
    });
    return count;
}
export default function Home({ loaderData: forumpost }: Route.ComponentProps) {
    const navigate = useNavigate();
    const [replyview, setReplyview] = useState(false);
    const [votes, setVotes] = useState(countVotes(forumpost?.votes || []));
    return (
        <div className='flex flex-col items-center justify-center min-h-screen min-w-screen'>
            <div className={replyview ? 'visible' : 'hidden'}>
                <Form method="post" className="flex flex-col space-y-4" onSubmit={() => { setReplyview(false) }}>
                    <input type="hidden" name="intent" value="reply" />
                    <label>
                        Reply:
                        <textarea name="content" className="border p-2 w-96 h-32" required />
                    </label>
                    <p>Current Votes: {votes}</p>

                    <a onClick={() => { setReplyview(false) }}>nope</a>
                </Form>
            </div>
            <h1 className="text-2xl font-bold">{forumpost?.title}</h1>
            <p className="text-gray-600">By {forumpost?.author.name} on {new Date(forumpost?.createdAt).toLocaleDateString()}</p>
            <p className="mt-4">{forumpost?.content}</p>
            <Form method="post" className="inline visible">
                <input type="hidden" name="intent" value="upvote" />

            </Form>
            <Form method="post" className="inline visible">
                <input type="hidden" name="intent" value="downvote" />

            </Form>
            <h2>replies</h2>
            {forumpost?.replies.map((reply) => (
                <div key={reply.id} className="border p-4 m-2 w-96">
                    <p className="text-gray-600">By {reply.author.name} on {new Date(reply.createdAt).toLocaleDateString()}</p>
                    <p className="mt-2">{reply.content}</p>
                </div>
            ))}
        </div>
    )
}
