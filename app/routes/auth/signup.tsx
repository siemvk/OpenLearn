
import i18next from "i18next";
import { User, KeyRound, LogIn, Mail } from "lucide-react";
import { useNavigate } from "react-router";
import { authClient } from "~/utils/auth/client";

export default function SignUp() {
  const navigate = useNavigate()
  return (
    <form className="min-h-screen flex flex-col items-center justify-center p-4 gap-4" onSubmit={async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const username = formData.get('username') as string;

      await authClient.signUp.email({
        email,
        username,
        password,
        name: username,
      }, {
        onSuccess(context) {
          alert(i18next.t('auth:signUpOk'))
          navigate('/auth/login')
        }
      })
    }}>

    </form>
  )
}