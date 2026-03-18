import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '~/utils/prisma'
import { admin, genericOAuth, organization, username } from "better-auth/plugins"

export const auth = betterAuth({
    appName: "OpenLearn",
    secret: process.env.AUTH_SECRET,

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: !!process.env.SMTP_HOST,
    },
    advanced: {
        database: {
            generateId: () => {
                return crypto.randomUUID()
            }
        }
    },
    socialProviders: {
        // idk
    },
    plugins: [
        genericOAuth({
            config: [
                ...(process.env.HACKCLUBAUTH_CLIENT_ID && process.env.HACKCLUBAUTH_CLIENT_SECRET) ? [{
                    providerId: "Hackclub",
                    discoveryUrl: "https://auth.hackclub.com/.well-known/openid-configuration",
                    clientId: process.env.HACKCLUBAUTH_CLIENT_ID || "",
                    clientSecret: process.env.HACKCLUBAUTH_CLIENT_SECRET || "",
                    scopes: ["openid", "email", "name"],
                }] : []
            ],
        }),
        organization({
            allowUserToCreateOrganization: async (user) => {
                return user.role === 'platform_admin'
            }
        }),
        admin(),
        username()
    ],
    baseURL: process.env.APP_BASE || 'http://localhost:5173',
    database: prismaAdapter(prisma, {
        provider: 'postgresql'
    })
})