"use client"
import { logOut } from "@/utils/auth/session"
import { useLayoutEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"

export default function Page() {
    const router = useRouter()
    useLayoutEffect(() => {
        try {
            logOut();
            router.push('/auth/sign-in');
        } catch (error) {
            toast.error("Error: " + (error as Error).message);
        }

    }, [router]); // Add dependency array to prevent unnecessary re-renders

    return (<></>)
}