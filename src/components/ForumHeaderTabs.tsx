"use client";
import { usePathname } from "next/navigation";
import Tabs, { TabItem } from "@/components/Tabs";
import ForumDialog from "@/app/home/forum/ForumDialog";

interface ForumHeaderTabsProps {
    tabs: TabItem[];
    defaultTab: string;
    baseRoute: string;
    banned: boolean;
    forumDisabled: boolean;
    banReason?: string | null;
    banEnd?: Date | null;
}

export default function ForumHeaderTabs({ tabs, defaultTab, baseRoute, banned, forumDisabled, banReason, banEnd }: ForumHeaderTabsProps) {
    const pathname = usePathname() || "";
    const segments = pathname.split('/');
    const segment = segments[3] || ""; // after /home/forum
    // Only render header on recognized tab routes or the root forum path
    const allowedTabs = tabs.map(tab => tab.id);
    if (segment !== "" && !allowedTabs.includes(segment)) {
        return null;
    }
    const urlTab = segment || defaultTab;

    return (
        <>
            {/* Header row */}
            <div className="py-4 md:py-6 px-3 md:px-6">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-4xl font-extrabold">Forum</h1>
                    <div className="flex-grow" />
                    <ForumDialog banned={banned} banreason={banReason} banEnd={banEnd} forumDisabled={forumDisabled} />
                </div>
            </div>

            {/* Tabs bar */}
            <div className="px-3 md:px-6 overflow-x-auto">
                <Tabs
                    tabs={tabs}
                    defaultActiveTab={urlTab}
                    withRoutes={true}
                    baseRoute={baseRoute}
                    renderContent={false}
                />
            </div>
        </>
    );
}
