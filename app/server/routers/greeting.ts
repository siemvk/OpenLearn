import type { TRPCRouterRecord } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, publicProcedure, veryProtectedProcedure } from '~/server/trpc'

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
        }),
    adminLog: protectedProcedure
        .input(
            z.object({
                message: z.string().min(1).max(1000)
            })
        )
        .mutation(async ({ input, ctx }) => {
            if (ctx.user.role !== 'admin') {
                throw new Error('Unauthorized')
            }
            const webhookUrl = process.env.DC_WEBHOOK_URL
            if (!webhookUrl) {
                console.warn('No webhook url configured')
                return { success: false, message: 'No webhook url configured' }
            }
            let content = ''
            if (process.env.DC_WEBHOOK_PING_PPL === 'true') {
                content += `KIJK LOGS! <@1491883464918700033>!`
            } else {
                content += 'we zijn aan het testen...'
            }
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content,
                    embeds: [{
                        title: 'Admin Log',
                        description: input.message,
                        timestamp: new Date().toISOString(),
                        author: {
                            name: ctx.user.name
                        },
                    }]
                })
            })
            if (!response.ok) {
                console.error('Failed to send webhook', await response.text())
                return { success: false, message: 'Failed to send webhook' }
            }
            return { success: true, message: 'Logged successfully' }
        }),

} satisfies TRPCRouterRecord
