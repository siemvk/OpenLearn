import { createTRPCRouter } from './trpc'
import { forumRouter } from './routers/forum'

import { greetingRouter as userRouter } from './routers/greeting'

export const appRouter = createTRPCRouter({
    user: userRouter,
    forum: forumRouter,

})

export type AppRouter = typeof appRouter
