import i18n from "i18next";
import { useNavigate } from "react-router";
import { Button } from "~/components/button/button";
import logo from "~/../public/logo.svg";
import MouseTrail from "~/components/mouse-trail"

export default function Home() {
  const navigate = useNavigate();
  return (
    <>
      <MouseTrail />
      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-row rounded-2xl w-full md:w-auto px-6 py-4 items-center justify-center">
          <h1 className="text-3xl md:text-3xl font-bold text-center">OpenLearn</h1>
          <img src={logo} alt="Logo" className="ml-4 w-32" />
        </div>
        <Button onClick={() => navigate('/auth/login')}>{i18n.t('auth:signupMarketing')}</Button>
      </div>
    </>
  );
}