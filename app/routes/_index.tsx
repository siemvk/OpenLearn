import i18n from "i18next";
import { useNavigate } from "react-router";

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Button onClick={() => navigate('/auth/login')}>
        {i18n.t("auth:login")}
      </Button>
    </div>
  );
}