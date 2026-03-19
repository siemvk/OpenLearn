import type { TRPCRouterRecord } from '@trpc/server'

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
    })
} satisfies TRPCRouterRecord
