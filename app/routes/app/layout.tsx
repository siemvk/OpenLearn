import { Outlet } from "react-router";
import { Navbar } from "~/components/navbar/navbar";
import { auth } from '~/utils/auth/server.server'
import { redirect } from "react-router";
import type { Route } from "./+types/layout";
import { caller } from '~/utils/trpc/server.server'
import { TRPCReactProvider } from '~/utils/trpc/react'

export async function loader(loaderArgs: Route.LoaderArgs) {
    const headers = new Headers(loaderArgs.request.headers)
    const result = await auth.api.getSession({ headers })
    const user = result?.user
    if (!user) {
        return redirect('/auth/login')
    }
    const api = await caller(loaderArgs)
    try {
        await api.user.checkSession()
    } catch (e) {
        return redirect('/auth/login')
    }
    return user
}


export default function MyAppLayout() {
    return (
        <>
            <Navbar />
            <TRPCReactProvider>
                <Outlet />
            </TRPCReactProvider>
        </>
    );
}
