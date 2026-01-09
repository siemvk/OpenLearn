"use client";

import { useState } from "react";
import Link from "next/link";
import Jdenticon from "@/components/Jdenticon";
import DeleteGroupButton from "@/components/groups/DeleteGroupButton";
import { getAdminData } from "./getAdminData";
import InfiniteScroll from "react-infinite-scroll-component";
import { Badge } from "@/components/ui/badge";

interface GroupsTabContentProps {
    initialGroupsData: any[];
    initialGroupsTotal: number;
    initialUserMapById: Record<string, any>;
}

export default function GroupsTabContent({
    initialGroupsData,
    initialGroupsTotal,
    initialUserMapById,
}: GroupsTabContentProps) {
    const [groupsData, setGroupsData] = useState(initialGroupsData);
    const [groupsHasMore, setGroupsHasMore] = useState(initialGroupsData.length < initialGroupsTotal);
    const [groupsTotal, setGroupsTotal] = useState(initialGroupsTotal);
    const [_userMapById, setUserMapById] = useState(initialUserMapById);
    const [loadingGroups, setLoadingGroups] = useState(false);

    const loadMoreGroups = async () => {
        if (loadingGroups || !groupsHasMore) return;
        setLoadingGroups(true);
        try {
            const result = await getAdminData("groepen", groupsData.length, 20);
            if (result.data.length === 0) {
                setGroupsHasMore(false);
            } else {
                setGroupsData((prevData) => [...prevData, ...result.data]);
                setGroupsHasMore(result.hasMore);
                setGroupsTotal(result.total);
                setUserMapById((prev) => ({ ...prev, ...result.userMapById }));
            }
        } catch (error) {
            console.error("Error loading more groups:", error);
            setGroupsHasMore(false);
        } finally {
            setLoadingGroups(false);
        }
    };

    if (groupsData.length === 0 && !groupsHasMore) {
        return (
            <div className="p-4 md:p-8 text-center text-gray-400 text-sm md:text-base">
                Geen groepen gevonden.
            </div>
        );
    }

    return (
        <div className="w-full">
            <h1 className="font-extrabold text-xl md:text-2xl py-4 px-2 md:px-0">
                {groupsTotal} groepen in db
            </h1>
            <InfiniteScroll
                dataLength={groupsData.length}
                next={loadMoreGroups}
                hasMore={groupsHasMore}
                loader={
                    <div className="text-center p-4 bg-neutral-800 rounded-md my-4 text-sm md:text-base">
                        Laden...
                    </div>
                }
                scrollThreshold={0.8}
                style={{ overflow: "visible" }}
            >
                <div className="space-y-3">
                    {groupsData.map((groep) => {
                        const memberCount = groep.members && typeof groep.members === 'object'
                            ? Object.keys(groep.members).length
                            : 0;
                        const listCount = groep.listsAdded && Array.isArray(groep.listsAdded)
                            ? groep.listsAdded.length
                            : 0;

                        return (
                            <div
                                key={groep.groupId}
                                className="relative bg-neutral-800 hover:bg-neutral-700 transition-colors rounded-lg overflow-hidden"
                            >
                                <div className="hidden md:flex items-center gap-3 p-4">
                                    <Link
                                        href={`/learn/group/${groep.groupId}`}
                                        className="shrink-0"
                                    >
                                        {groep.image ? (
                                            <img
                                                src={groep.image}
                                                alt={`Groepsfoto van ${groep.name}`}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <Jdenticon 
                                                value={groep.name} 
                                                size={48} 
                                                className="w-12 h-12 rounded-lg" 
                                            />
                                        )}
                                    </Link>

                                    <Link
                                        href={`/learn/group/${groep.groupId}`}
                                        className="flex-1 min-w-0"
                                    >
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-lg font-bold text-white truncate">
                                                    {groep.name}
                                                </h3>
                                                {groep.requiresApproval && (
                                                    <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/50 text-xs shrink-0">
                                                        Goedkeuring vereist
                                                    </Badge>
                                                )}
                                            </div>

                                            {groep.description && (
                                                <p className="text-sm text-neutral-400 line-clamp-1">
                                                    {groep.description}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-1 text-sm text-neutral-400">
                                                <span>{memberCount} {memberCount === 1 ? "lid" : "leden"}</span>
                                                <span>•</span>
                                                <span>{listCount} {listCount === 1 ? "lijst" : "lijsten"}</span>
                                            </div>
                                        </div>
                                    </Link>

                                    <div className="shrink-0">
                                        <div className="flex items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                                            <DeleteGroupButton groupId={groep.groupId} />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:hidden p-3">
                                    <Link
                                        href={`/learn/group/${groep.groupId}`}
                                        className="flex items-start gap-3 mb-3"
                                    >
                                        <div className="shrink-0">
                                            {groep.image ? (
                                                <img
                                                    src={groep.image}
                                                    alt={`Groepsfoto van ${groep.name}`}
                                                    className="w-10 h-10 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <Jdenticon 
                                                    value={groep.name} 
                                                    size={40} 
                                                    className="w-10 h-10 rounded-lg" 
                                                />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-base font-bold text-white wrap-break-word">
                                                        {groep.name}
                                                    </h3>
                                                    {groep.requiresApproval && (
                                                        <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/50 text-xs shrink-0">
                                                            Goedkeuring vereist
                                                        </Badge>
                                                    )}
                                                </div>

                                                {groep.description && (
                                                    <p className="text-sm text-neutral-400 line-clamp-2 wrap-break-word">
                                                        {groep.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-1 text-xs text-neutral-400">
                                                    <span>{memberCount} {memberCount === 1 ? "lid" : "leden"}</span>
                                                    <span>•</span>
                                                    <span>{listCount} {listCount === 1 ? "lijst" : "lijsten"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>

                                    <div className="flex justify-start pt-2 border-t border-neutral-700">
                                        <div className="flex items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors">
                                            <DeleteGroupButton groupId={groep.groupId} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </InfiniteScroll>
        </div>
    );
}