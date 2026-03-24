import type { TRPCRouterRecord } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, publicProcedure } from '~/server/trpc'

export const forumRouter = {
    getPosts: publicProcedure
        .input(
            z.object({
                // filters
                subject: z.string().length(2).optional(),
                authorId: z.uuid().optional(),
                // standaard nemen we 20 posts
                take: z.number().min(1).max(100).optional(),
                skip: z.number().min(0).optional()
            })
        )
        .query(async ({ input, ctx }) => {
            return ctx.prisma.forumPost.findMany(
                {
                    where: {
                        subject: input.subject,
                        authorId: input.authorId
                    },
                    take: input.take ?? 20,
                    skip: input.skip ?? 0,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        author: true
                    }
                }
            )
        }),
    makePost: protectedProcedure
        .input(
            z.object({
                title: z.string().min(1).max(100),
                content: z.string().min(1).max(5000),
                subject: z.string().length(2)
            })
        )
        .mutation(async ({ input, ctx }) => {
            const newPost = await ctx.prisma.forumPost.create({
                data: {
                    title: input.title,
                    content: input.content,
                    authorId: ctx.user.id,
                    subject: input.subject
                }
            })
            return newPost
        }),
    getSpecificPost: publicProcedure
        .input(
            z.object({
                postId: z.uuid()
            })
        )
        .query(async ({ input, ctx }) => {
            const post = await ctx.prisma.forumPost.findUnique({
                where: {
                    id: input.postId
                },
                // we willen ook 
                // - replies met authors
                // - author van de post
                // - votes op de post
                // postgers is nice
                include: {
                    replies: { include: { author: true } },
                    author: true,
                    votes: true
                }
            })
            return post
        }),
    votePost: protectedProcedure
        .input(
            z.object({
                postId: z.uuid(),
                vote: z.enum(['UPVOTE', 'DOWNVOTE'])
            })
        )
        .mutation(async ({ input, ctx }) => {
            // check if user has already voted
            const existingVote = await ctx.prisma.forumVote.findFirst({
                where: {
                    userId: ctx.user.id,
                    postId: input.postId
                }
            })
            const post = await ctx.prisma.forumPost.findUnique({
                where: {
                    id: input.postId
                }
            })
            if (!post) {
                throw new Error("Post does not exist")
            }
            if (existingVote) {
                // update existing vote
                const updatedVote = await ctx.prisma.forumVote.update({
                    where: {
                        id: existingVote.id
                    },
                    data: {
                        vote: input.vote
                    },
                })
                return updatedVote
            } else {
                // create new vote
                const newVote = await ctx.prisma.forumVote.create({
                    data: {
                        vote: input.vote,
                        userId: ctx.user.id,
                        postId: input.postId
                    },
                })
                return newVote
            }
        }),
    replyToPost: protectedProcedure
        .input(
            z.object({
                postId: z.uuid(),
                content: z.string().min(1).max(2000)
            })
        )
        .mutation(async ({ input, ctx }) => {
            const newReply = await ctx.prisma.forumPostReply.create({
                data: {
                    content: input.content,
                    postId: input.postId,
                    authorId: ctx.user.id
                }
            })
            return newReply
        })


} satisfies TRPCRouterRecord
