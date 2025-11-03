"use client";
import { usePathname } from 'next/navigation';
import SessionProvider from "@/components/sessionProvider";
import React from 'react';

export default function SessionWrapper({ children, session }: { children: React.ReactNode, session?: any }) {
    if (!session.id) {
        return <>{children}</>;
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const pathname = usePathname();

    // Only apply SessionProvider if not on the root path
    if (pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/admin')) {
        return <>{children}</>;
    }

    return (
        <SessionProvider checkInterval={5 * 1000}>
            {children}
        </SessionProvider>
    );
}
