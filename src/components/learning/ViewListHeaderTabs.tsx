"use client";
import { usePathname } from "next/navigation";
import Tabs, { TabItem } from "@/components/Tabs";

interface ViewListHeaderTabsProps {
  tabs: TabItem[];
  defaultTab: string;
  baseRoute: string;
  listId: string;
}

export default function ViewListHeaderTabs({ tabs, defaultTab, baseRoute, listId }: ViewListHeaderTabsProps) {
  const pathname = usePathname() || "";

  // Check if we're on a detail page (like /resultaten/[sessionid])
  // If so, determine which tab section we're in
  let activeTab = defaultTab;

  if (pathname.includes(`/learn/viewlist/${listId}/resultaten`)) {
    activeTab = "resultaten";
  } else if (pathname.includes(`/learn/viewlist/${listId}/woorden`)) {
    activeTab = "woorden";
  } else {
    // Try to extract from URL segments
    const segments = pathname.split('/');
    const viewlistIndex = segments.indexOf('viewlist');
    if (viewlistIndex >= 0 && segments[viewlistIndex + 2]) {
      const potentialTab = segments[viewlistIndex + 2];
      if (tabs.some(tab => tab.id === potentialTab)) {
        activeTab = potentialTab;
      }
    }
  }

  return (
    <Tabs
      tabs={tabs}
      defaultActiveTab={activeTab}
      withRoutes={true}
      baseRoute={baseRoute}
      renderContent={false}
    />
  );
}
