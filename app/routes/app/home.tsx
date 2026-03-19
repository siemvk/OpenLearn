import type { Route } from "./+types/home";
import { authClient } from "~/utils/auth/client"
import { auth } from '~/utils/auth/server'
import { redirect, useNavigate } from "react-router";

export async function loader(loaderArgs: Route.LoaderArgs) {
    const headers = new Headers(loaderArgs.request.headers)
    const result = await auth.api.getSession({ headers })
    const user = result?.user
    if (!user) {
        return redirect('/auth/login')
    }
    return user
}

export default function Home({ loaderData: user }: Route.ComponentProps) {
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen min-w-screen">
            <div className="flex flex-col items-center">
                <div className="flex flex-col items-center gap-1">
                    <strong>Hallo, {user?.name}!</strong>
                    <p>Welkom bij Openlearn</p>
                </div>

                <div className="mt-6">
                </div>
            </div>

        </div>
    )

}
