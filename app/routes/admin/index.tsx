import type { Route } from "./+types/index";
import { auth } from '~/utils/auth/server.server'
import { Form, redirect, useNavigate } from "react-router";
import { caller } from "~/utils/trpc/server.server";
import "~/components/text-field/text-field.css";

type ConfigItem = {
    key: string;
    value: boolean;
};

export async function loader(loaderArgs: Route.LoaderArgs) {
    const headers = new Headers(loaderArgs.request.headers)
    const result = await auth.api.getSession({ headers })
    const user = result?.user
    if (!user) {
        return redirect('/auth/login')
    }
    const api = await caller(loaderArgs);
    const config = (await api.user.getConfig({})) as ConfigItem[]

    const safeModeConfig = config.find((c: ConfigItem) => c.key === 'safeMode')
    if (!safeModeConfig) {
        await api.user.setConfig({ key: 'safeMode', value: false })
        config.push({ key: 'safeMode', value: false })
    }

    return { user, config };
}

export async function action(actionArgs: Route.ActionArgs) {
    const headers = new Headers(actionArgs.request.headers)
    const result = await auth.api.getSession({ headers })
    const user = result?.user
    if (!user) {
        return redirect('/auth/login')
    }

    const formData = await actionArgs.request.formData()
    const key = formData.get('key')
    if (typeof key !== 'string' || key.length === 0) {
        return new Response('Invalid config key', { status: 400 })
    }
    const value = formData.get('value') === 'true'

    const api = await caller(actionArgs);
    await api.user.setConfig({ key, value })


    return redirect('/admin');
}

export default function Home({ loaderData: { config } }: Route.ComponentProps) {
    const configItems = Array.isArray(config) ? config : []

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen min-w-screen">
            <div className="flex flex-col items-center">
                <div className="flex flex-col items-center gap-1">
                    <strong>admin dingen</strong>

                    {configItems.map((c: ConfigItem) => (
                        <Form key={c.key} method="post" action="/admin" className="flex flex-row items-center gap-2">
                            <input type="hidden" name="key" value={c.key} />
                            <input type="hidden" name="value" value={String(!c.value)} />
                            <span>{c.key}</span>
                            <input
                                type="checkbox"
                                className="text-field-checkbox"
                                checked={c.value}
                                onChange={(event) => event.currentTarget.form?.requestSubmit()}
                            />
                        </Form>
                    ))}
                </div>
            </div>
        </div>
    )

}
