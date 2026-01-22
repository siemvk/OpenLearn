import type { Route } from "./+types/user";
import { authClient } from "~/utils/auth/client"
import { Button } from '@polarnl/polarui-react'
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
    const navigate = useNavigate()
    const signOut = async () => {
        await authClient.signOut({}, { onSuccess: () => { navigate('/auth/login') } })
    }
    return (
        <div className='flex flex-col items-center justify-center min-h-screen min-w-screen'>
            Hallo, {user?.name}, Welkom bij PolarLearn!
            <Button onClick={signOut}>Log uit</Button>
        </div>
    )
}