import type { Route } from "./+types/home";
import { authClient } from "~/utils/auth/client"
import { auth } from '~/utils/auth/server.server'
import { redirect, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import "../admin/admin.css"
import { Button } from "~/components/button/button";

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
    const { t } = useTranslation();
    const navigate = useNavigate();
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen min-w-screen">
            <div className="flex flex-col items-center">
                <div className="flex flex-col items-center gap-1">
                    <h1 className="text-3xl font-bold">{t("startPage:welcome")}</h1>
                    <p className="text-lg text-gray-300">{t("startPage:description")}</p>
                    {(user.role && user.role.includes('admin')) &&
                        <div className="admin-layout">
                            <Button onClick={() => {
                                navigate('/admin')
                            }}>

                                Admin
                            </Button>
                        </div>
                    }

                </div>
            </div>

        </div>
    )

}
