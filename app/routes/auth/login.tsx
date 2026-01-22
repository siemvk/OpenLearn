import { authClient } from '~/utils/auth/client'
import { Button, Input } from '@polarnl/polarui-react'
import { KeyRound, LogIn, User } from 'lucide-react'
import i18next from 'i18next'
import zod from 'zod'
import { useNavigate, useSearchParams } from 'react-router'
import { useEffect } from 'react'

export function geti18nAuthMessageByCode(code: string) {
  switch (code) {
    case "USERNAME_IS_INVALID":
      return i18next.t('auth:errors.usernameIsInvalid')
    case "INVALID_EMAIL_OR_PASSWORD":
      return i18next.t('auth:errors.invcreds')
    case "INVALID_USERNAME_OR_PASSWORD":
      return i18next.t('auth:errors.invcreds')
    case "USERNAME_TOO_SHORT":
      return i18next.t('auth:errors.UserShort')
    case "PROVIDER_NOT_ENABLED":
      return i18next.t('auth:errors.ProviderDisabled')
    case "OAUTH_ERROR":
      return i18next.t('auth:errors.AuthError')
    case "PROVIDER_ERROR":
      return i18next.t('auth:errors.AuthError')
    case "OAUTH_EMAIL_MISSING":
      return i18next.t('auth:errors.AuthError')
    case "OAUTH_ACCOUNT_NOT_LINKED":
      return i18next.t('auth:errors.noConnectedAccount')
    case "ACCOUNT_DISABLED":
      return i18next.t('auth:errors.AccountDisabled') // Is anders dan Bans, worden niet veel gebruikt
    default:
      return i18next.t('auth:errors.unknown')
  }
}

export default function SignIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams();

  useEffect(() => {
    switch (searchParams.get('error')) {
      case 'signup_disabled':
        alert(i18next.t('auth:errors.noConnectedAccount'))
        navigate('/auth/login')
        break;
      case 'account_not_linked':
        alert(i18next.t('auth:errors.noConnectedAccount'))
        navigate('/auth/login')
        break;
    }
  }, [])

  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-4 gap-4'>
      <Button
        onClick={async () => {
          await authClient.signIn.social({
            provider: 'PolarNL-StaffAuth',
            callbackURL: '/user',
            errorCallbackURL: '/auth/login',
          })
        }}
      >
        Medewerkers inlog
      </Button>
      <form onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const emailOrUsername = formData.get('emailOrUsername') as string;
        const password = formData.get('password') as string;

        if (zod.email().safeParse(emailOrUsername).success) {
          await authClient.signIn.email({
            email: emailOrUsername,
            password,
          },
            {
              onError(context) {
                alert(geti18nAuthMessageByCode(context.error.code))
              },
              onSuccess(context) {
                navigate('/user')
              },
            }
          )
        } else {
          await authClient.signIn.username({
            username: emailOrUsername,
            password,
          },
            {
              onError(context) {
                alert(geti18nAuthMessageByCode(context.error.code))
              },
              onSuccess(context) {
                navigate('/user')
              }
            })
        }
      }}>
        <Input placeholder={i18next.t('auth:emailOrUsername')} name="emailOrUsername" className="mb-2" icon={<User />} scheme='dark' />
        <Input type="password" placeholder={i18next.t('auth:password')} name="password" className="mb-4" scheme='dark' icon={<KeyRound />} />
        <Button type="submit" icon={<LogIn />}>
          {i18next.t('auth:login')}
        </Button>
      </form>
    </div>
  )
}
