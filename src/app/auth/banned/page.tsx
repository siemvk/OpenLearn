import { getUserFromSession } from "@/utils/auth/auth"
import { redirect } from "next/navigation";

export default async function BannedPage() {
  const user = await getUserFromSession();
  if (!user || user.loginAllowed) {
    return redirect('/home/start')
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="bg-neutral-800 h-80 px-4 max-w-140 w-full flex items-center justify-center flex-col rounded-2xl">
        <h1 className="text-6xl mb-4">⛔</h1>
        <p className="text-4xl font-bold">Je bent verbannen</p>
        <p className="text-lg text-center mt-4">Je bent verbannen wegens schending van de algemene voorwaarden. Reden: {user?.banReason}</p>
        <p className="text-lg text-center mt-4">Je kan hieronder met support praten om je verbanning te bespreken.</p>
      </div>
    </div>
  )
}