import { authClient } from '~/utils/auth/client'
import { Button, } from '@polarnl/polarui-react'

export default function SignIn() {
    const signIn = async (provider: string) => {
        await authClient.signIn.social({
            provider: provider,
            callbackURL: '/app',
        })
    }


    return (
        <div className='min-h-screen flex flex-col items-center justify-center p-4 gap-4'>
            <Button
                onClick={() => signIn('PolarNL')}
            >
                login with PolarNL
            </Button>
            <Button
                onClick={() => signIn('hackclub')}
            >
                login with Hackclub
            </Button>
        </div>
    )
}
