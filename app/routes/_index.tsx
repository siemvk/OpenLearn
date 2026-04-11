import i18n from "i18next";
import { useNavigate } from "react-router";
import { Button } from "~/components/button/button";
import logo from "~/../public/logos/OL-VT-LONG-LOGO.png";


export default function Home() {
  const navigate = useNavigate();
  return (
    <>
      <div className="flex flex-col items-center justify-center">
        <div className="flex flex-row rounded-2xl w-full md:w-auto px-6 py-4 items-center justify-center">
          <img src={logo} alt="Logo" className="ml-4 w-128" />
        </div>
        <Button onClick={() => navigate('/auth/login')}>{i18n.t('auth:signupMarketing')}</Button>
      </div>
    </>
  );
}