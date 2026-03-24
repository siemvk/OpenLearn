import { createTRPCRouter } from './trpc'
import { forumRouter } from './routers/forum'

import { greetingRouter as userRouter } from './routers/greeting'
import { learnRouting } from './routers/learn'

export const appRouter = createTRPCRouter({
    user: userRouter,
    forum: forumRouter,
    learn: learnRouting
})

export type AppRouter = typeof appRouter
