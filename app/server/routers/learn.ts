import type { TRPCRouterRecord } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, publicProcedure } from '~/server/trpc'

export const learnRouting = {
    makeList: protectedProcedure
        .input(
            z.object({
                name: z.string().min(1).max(100),
                list: z.array(
                    z.object({
                        vraag: z.string().min(1).max(100),
                        antwoord: z.string().min(1).max(100)
                    })
                )
            })
        )
        .mutation(async ({ input, ctx }) => {
            const list = await ctx.prisma.list.create({
                data: {
                    name: input.name,
                    ownerId: ctx.user.id,
                    listItems: {
                        create: input.list
                    }
                },
                include: { listItems: true }
            })
            return list
        }),
    getList: protectedProcedure
        .input(
            z.object({
                id: z.string().min(1)
            })
        )
        .query(async ({ input, ctx }) => {
            const list = await ctx.prisma.list.findFirst({
                where: {
                    id: input.id,
                },
                include: {
                    listItems: true
                }
            })
            return list
        }),
    startLearnSession: protectedProcedure
        .input(
            z.object({
                listId: z.string().min(1)
            })
        )
        .mutation(async ({ input, ctx }) => {
            const listItems = await ctx.prisma.listItemSaved.findMany({
                where: {
                    listId: input.listId
                }
            })
            if (listItems.length === 0) {
                throw new Error("List has no items or does not exist")
            }
            const session = await ctx.prisma.listSession.create({
                data: {
                    listId: input.listId,
                    userId: ctx.user.id,
                    listSessionItems: {
                        create: listItems.map(item => ({
                            vraag: item.vraag,
                            antwoord: item.antwoord
                        }))
                    }
                },
                include: {
                    listSessionItems: true,
                }
            })
            return session
        }),
    updateLearnSessionItem: protectedProcedure
        .input(
            z.object({
                listSessionIdItem: z.string().min(1),
                round: z.number().int().min(1),
                antwoord: z.string().min(1).max(100),
                goed: z.boolean()
            })
        )
        .mutation(async ({ input, ctx }) => {
            const sessionItem = await ctx.prisma.listSessionItem.findFirst({
                where: {
                    id: input.listSessionIdItem
                },
                include: {
                    listSession: true
                }
            })
            if (!sessionItem) {
                throw new Error("List session item does not exist")
            }
            console.log(sessionItem.listSession.userId, ctx.user.id)
            if (sessionItem.listSession.userId !== ctx.user.id) {
                throw new Error("You do not have permission to update this session item")
            }

            const updated = await ctx.prisma.listSessionItem.update({
                where: {
                    id: input.listSessionIdItem
                },
                data: {
                    listSessionItemAnswerHistories: {
                        create: {
                            round: input.round,
                            antwoord: input.antwoord,
                            goed: input.goed
                        }
                    }
                },
                include: {
                    listSessionItemAnswerHistories: true
                }
            })
            return updated
        })
} satisfies TRPCRouterRecord
