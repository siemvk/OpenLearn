import type { TRPCRouterRecord } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, publicProcedure } from '~/server/trpc'

export const greetingRouter = {
    hello: publicProcedure.query(() => {
        return 'hello world'
    }),
    user: protectedProcedure.query(async ({ input, ctx }) => {
        const user = await ctx.prisma.user.findFirst({
            where: {
                id: ctx.user?.id
            }
        })

        return user
    }),
    checkSession: protectedProcedure.query(async ({ ctx }) => {
        return ctx.user
    }),
    getUserForumPosts: protectedProcedure
        .input(
            z.object({
                take: z.number().min(1).max(100).optional(),
                skip: z.number().min(0).optional()
            })
        )
        .query(async ({ input, ctx }) => {
            const posts = await ctx.prisma.forumPost.findMany({
                where: {
                    authorId: ctx.user.id
                },
                take: input.take ?? 20,
                skip: input.skip ?? 0,
                orderBy: {
                    createdAt: 'desc'
                }
            })
            return posts
        })
} satisfies TRPCRouterRecord
