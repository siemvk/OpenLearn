import type { TRPCRouterRecord } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, publicProcedure, veryProtectedProcedure } from '~/server/trpc'

export const greetingRouter = {
  banUser: veryProtectedProcedure
    .input(z.object({
      userId: z.uuid(),
      level: z.enum(['forum', 'website'])
    })).mutation(async ({ input, ctx }) => {

      ctx.prisma.user.update({
        where: {
          id: input.userId,
        },
        data: {
          ...(input.level == "forum" ? {
            forumBanned: true
          } : {
            banned: true
          })
        }
      })
    }),
  getUserProfile: veryProtectedProcedure
    .input(
      z.uuid()
    ).mutation(async ({ input, ctx }) => {
      const user = await ctx.prisma.user.findFirstOrThrow({
        where: {
          id: input
        },
        include: {
          forumPosts: true,
          lists: true,
          accounts: true,
          forumPostReplies: true,
        }
      });
      return user;
    })
} satisfies TRPCRouterRecord

