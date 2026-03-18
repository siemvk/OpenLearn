import i18n from "i18next";
import { useNavigate } from "react-router";
import { Button } from "~/components/button";

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <Button>hi</Button>
    </div>
  );
}