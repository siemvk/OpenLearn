import { Outlet } from "react-router";
import { Navbar } from "~/components/navbar/navbar";
import { auth } from '~/utils/auth/server'
import { redirect } from "react-router";
import type { Route } from "./+types/layout";
import { caller } from '~/utils/trpc/server'

export async function loader(loaderArgs: Route.LoaderArgs) {
    const headers = new Headers(loaderArgs.request.headers)
    const result = await auth.api.getSession({ headers })
    const user = result?.user
    if (!user) {
        return redirect('/auth/login')
    }
    if (!user.role) {
        return redirect('/nee')
    }
    if (!user.role.includes('admin')) {
        return redirect('/nee')
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
            <Navbar knoppen={[
                {
                    title: 'Admin',
                    linkTo: '/admin'
                },
                {
                    title: 'Forum safety',
                    linkTo: '/admin/forum'
                }
            ]} />
            <Outlet />
        </>
    );
}