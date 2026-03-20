
// GA WEG
// NEE ECHT GA WEG
// DIT IS DE TRPC ENDPOINT TENZIJ JE WEET HOE JE EEN NUCLEAREREACTOR KAN BOUWEN MAG JE ER NIET AAN ZITTEN

// het is mij gelukt en ik weet hoe ik een nuclearereactor moet bouwen :)
// - unbravechimp

import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import { appRouter } from '~/server/main'
import { createTRPCContext } from '~/server/trpc'

import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router'

export const loader = async (args: LoaderFunctionArgs) => {
    return handleRequest(args)
}

export const action = async (args: ActionFunctionArgs) => {
    return handleRequest(args)
}

function handleRequest(args: LoaderFunctionArgs | ActionFunctionArgs) {
    return fetchRequestHandler({
        endpoint: '/api/trpc',
        req: args.request,
        router: appRouter,
        createContext: () =>
            createTRPCContext({
                headers: args.request.headers
            }),
        onError({ error, path }) {
            if (error.code === 'INTERNAL_SERVER_ERROR') {
                console.error(`tRPC error on ${path}:`, error) // errur handleiding
            }
        },
        responseMeta() {
            return {
                headers: {
                    'Cache-Control': 'no-store',
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'DENY', // zekurity
                }
            }
        }
    })
}
