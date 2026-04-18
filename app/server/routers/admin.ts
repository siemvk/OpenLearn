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
          ...( input.level == "forum" ? {
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
    ).mutation(async ({input, ctx})=>{
      const forumPosts = await ctx.prisma.forumPost.findMany({
        where: {
          authorId: input
        }
      })
      const forumReplys = await ctx.prisma.forumPostReply.findMany({
        where: {
          authorId: input
        }
      })
      const userData = await ctx.prisma.user.findFirstOrThrow({
        where: {
          id: input
        }
      })
       
      return {
        user: userData,
        forum: {
          posts: forumPosts,
          replys: forumReplys
        }
        
      }
    })
} satisfies TRPCRouterRecord

