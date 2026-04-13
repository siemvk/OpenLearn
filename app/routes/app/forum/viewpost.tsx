import type { Route } from "./+types/viewpost";
import { useEffect, useState } from "react";
import { redirect } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from "~/components/button/button"
import { useTranslation } from "react-i18next";
import { caller } from '~/utils/trpc/server'
import { useTRPC } from '~/utils/trpc/react'
// prisma types importen is zo lelijk
import type { ForumVoteModel } from "~/../generated/prisma/models"
import { ListContainer, ListItem } from "~/components/list/list";
import config from "~/utils/config";

export async function loader(loaderArgs: Route.LoaderArgs) {
    const postId = loaderArgs.params.postId;

    if (!postId) {
        return redirect('/app/forum');
    }

    try {
        const api = await caller(loaderArgs);
        const post = await api.forum.getSpecificPost({ postId });

        if (!post) {
            return redirect('/app/forum');
        }

        return post;
    } catch {
        return redirect('/app/forum');
    }
}

function countVotes(votes: ForumVoteModel[]) {
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
export default function Home({ loaderData: initialPost }: Route.ComponentProps) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const [replyview, setReplyview] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const postId = initialPost.id;

    const postQuery = useQuery(
        trpc.forum.getSpecificPost.queryOptions({ postId }, {
            initialData: initialPost,
            staleTime: config.refetchTime,
            refetchInterval: config.refetchTime,
            refetchIntervalInBackground: config.refetch
        })
    );

    const refreshPost = async () => {
        if (!postId) {
            return;
        }
        await queryClient.invalidateQueries(trpc.forum.getSpecificPost.queryFilter({ postId }));
    };

    const voteMutation = useMutation(
        trpc.forum.votePost.mutationOptions({
            onSuccess: refreshPost,
        })
    );

    const replyMutation = useMutation(
        trpc.forum.replyToPost.mutationOptions({
            onSuccess: async () => {
                setReplyview(false);
                setReplyContent('');
                await refreshPost();
            },
        })
    );

    const post = postQuery.data ?? initialPost;
    const votes = countVotes(post?.votes || []);
    const createdAt = post?.createdAt ? new Date(post.createdAt).toLocaleDateString() : '';
    const repliesCount = post?.replies.length ?? 0;

    if (postQuery.isLoading) {
        return (
            <div className="flex w-full items-center justify-center p-8 text-neutral-300">
                {t('common:loading')}
            </div>
        );
    }

    if (postQuery.isError || !post) {
        return null;
    }

    return (
        <div className="flex flex-col items-center justify-start w-full p-0 m-0">
            <div className="w-full max-w flex flex-col gap-4 p-5">
                <div className="flex flex-col gap-2 bg-openlearn-800 rounded-2xl p-6">
                    <h1 className="text-3xl font-bold">{post.title}</h1>
                    <p className="text-neutral-300">
                        {t("forum:viewpost:byOn", { author: post.author.name, date: createdAt })}
                    </p>

                    <p className="text-neutral-300 text-sm">
                        {t("forum:viewpost:stats", {
                            votes: votes > 0 ? `+${votes}` : votes,
                            replies: repliesCount,
                        })}
                    </p>

                    <p className="mt-3 whitespace-pre-wrap text-neutral-100 leading-7">
                        {post.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-1 mt-2">
                        <Button
                            type="button"
                            onClick={() => voteMutation.mutate({ postId: post.id, vote: 'UPVOTE' })}
                            disabled={voteMutation.isPending}
                        >
                            {t("forum:viewpost:actions:upvote")}
                        </Button>

                        <Button
                            type="button"
                            onClick={() => voteMutation.mutate({ postId: post.id, vote: 'DOWNVOTE' })}
                            disabled={voteMutation.isPending}
                        >
                            {t("forum:viewpost:actions:downvote")}
                        </Button>

                        <Button type="button" onClick={() => setReplyview(!replyview)}>
                            {replyview ? t("forum:viewpost:actions:cancel") : t("forum:viewpost:actions:reply")}
                        </Button>
                    </div>
                </div>

                {replyview && (
                    <form
                        className="flex flex-col gap-4 bg-openlearn-800 rounded-2xl p-6"
                        onSubmit={(event) => {
                            event.preventDefault();
                            if (!postId || !replyContent.trim()) {
                                return;
                            }
                            replyMutation.mutate({ postId, content: replyContent });
                        }}
                    >
                        <textarea
                            value={replyContent}
                            onChange={(event) => setReplyContent(event.target.value)}
                            placeholder={t("forum:viewpost:placeholders:reply")}
                            rows={6}
                            className="border rounded px-4 py-2 border-gray-700 bg-gray-800"
                            required
                        />
                        <div className="flex flex-wrap items-center gap-1">
                            <Button type="submit" disabled={replyMutation.isPending}>
                                {t("forum:viewpost:actions:postReply")}
                            </Button>
                            <Button type="button" onClick={() => setReplyview(false)}>{t("forum:viewpost:actions:cancel")}</Button>
                        </div>
                    </form>
                )}

                <div className="flex flex-col gap-3">
                    <h2 className="text-2xl font-bold">{t("forum:viewpost:repliesTitle")}</h2>

                    {repliesCount === 0 && (
                        <div className="bg-openlearn-800 rounded-2xl p-6 text-neutral-300">
                            {t("forum:viewpost:noReplies")}
                        </div>
                    )}
                    <ListContainer className="w-full max-w">
                        {post.replies.map((reply) => (
                            <ListItem key={reply.id} subtitle={t("forum:viewpost:replyTitle", { name: reply.author.name, date: new Date(reply.createdAt).toLocaleDateString() })} title={reply.content} swapSubtitleAndTitle={true} />
                            // <div key={reply.id} className="bg-openlearn-800 rounded-2xl p-4">
                            //     <div className="flex flex-wrap items-center justify-between gap-2">
                            //         <h3 className="font-semibold text-lg text-gray-100">{reply.author.name}</h3>
                            //         <p className="text-gray-300 text-sm">{new Date(reply.createdAt).toLocaleDateString()}</p>

                            //     </div>
                            //     <p className="text-gray-100 mt-2 whitespace-pre-wrap">{reply.content}</p>
                            // </div>
                        ))}
                    </ListContainer>
                </div>
            </div>
        </div>
    )
}
