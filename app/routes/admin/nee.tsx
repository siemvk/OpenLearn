import type { Route } from "./+types/nee";

export default function Home() {
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen min-w-screen">
            <div className="flex flex-col items-center">
                <div className="flex flex-col items-center gap-1">
                    <img src={"https://cdn.siemvk.nl/aardige man 😀.png"} />
                    <strong>Wat doe jij hier</strong>
                </div>
            </div>
        </div>
    )

}