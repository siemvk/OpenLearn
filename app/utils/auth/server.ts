import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '~/utils/prisma'
import { genericOAuth } from "better-auth/plugins"

export const auth = betterAuth({
    emailAndPassword: {
        enabled: true,
    },

    socialProviders: {
        // Add social providers here (e.g., Google, Facebook)
    },
    plugins: [
        genericOAuth({
            config: [
                {
                    providerId: "hackclub",
                    discoveryUrl: "https://auth.hackclub.com/.well-known/openid-configuration",
                    clientId: process.env.HACKCLUB_CLIENT_ID || "",
                    clientSecret: process.env.HACKCLUB_CLIENT_SECRET || "",
                    scopes: ["openid", "profile", "email", "name"],
                },
            ],
        }),
    ],
    database: prismaAdapter(prisma, {
        provider: 'postgresql'
    })
})