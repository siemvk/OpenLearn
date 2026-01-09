"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Jdenticon from "@/components/Jdenticon";
import DeleteListButton from "@/components/learning/DeleteListButton";
import BanButton from "./banButton";
import DeleteGroupButton from "@/components/groups/DeleteGroupButton";
import DeleteUserButton from "./DeleteUserButton";
import ResetPasswordButton from "./ResetPasswordButton";
import ImpersonateUserButton from "./ImpersonateUserButton";
import JweDecoderWrapper from "./JweDecoderWrapper";
import Tabs, { TabItem } from "@/components/Tabs";
import { getAdminData } from "./getAdminData";
import InfiniteScroll from "react-infinite-scroll-component";
import { getSubjectIcon, getSubjectName } from "@/components/icons";
import { Users, ListTodo, School, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SendNotificationButton from "./SendNotificationButton";
import AlgemeenTabContent from "./AlgemeenTabContent";

interface AdminTabsProps {
    initialUsersData: any[];
    initialUsersTotal: number;
    initialListsData: any[];
    initialListsTotal: number;
    initialGroupsData: any[];
    initialGroupsTotal: number;
    userMapById: Record<string, any>;
    defaultActiveTab: string;
    currentUserId: string | null;
}

export default function AdminTabs({
    initialUsersData,
    initialUsersTotal,
    initialListsData,
    initialListsTotal,
    initialGroupsData,
    initialGroupsTotal,
    userMapById: initialUserMapById,
    defaultActiveTab,
    currentUserId,
    renderContent = true, // Added for layout usage
}: AdminTabsProps & { renderContent?: boolean }) {
    // Added for layout usage
    // Users tab state
    const [usersData, setUsersData] = useState(initialUsersData);
    const [usersHasMore, setUsersHasMore] = useState(
        initialUsersData.length < initialUsersTotal
    );
    const [usersTotal, setUsersTotal] = useState(initialUsersTotal);

    // Lists tab state
    const [listsData, setListsData] = useState(initialListsData);
    const [listsHasMore, setListsHasMore] = useState(
        initialListsData.length < initialListsTotal
    );
    const [listsTotal, setListsTotal] = useState(initialListsTotal);

    // Groups tab state
    const [groupsData, setGroupsData] = useState(initialGroupsData);
    const [groupsHasMore, setGroupsHasMore] = useState(
        initialGroupsData.length < initialGroupsTotal
    );
    const [groupsTotal, setGroupsTotal] = useState(initialGroupsTotal);

    const [userMapById, setUserMapById] = useState(initialUserMapById);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingLists, setLoadingLists] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(false); // Load more users
    const loadMoreUsers = async () => {
        if (loadingUsers) return;
        setLoadingUsers(true);

        try {
            const result = await getAdminData("gebruikers", usersData.length, 20);

            if (result.data.length === 0) {
                setUsersHasMore(false);
            } else {
                setUsersData((prevData) => [...prevData, ...result.data]);
                setUsersHasMore(result.hasMore);
                setUsersTotal(result.total);
            }
        } catch (error) {
            console.error("Error loading more users:", error);
            setUsersHasMore(false);
        } finally {
            setLoadingUsers(false);
        }
    }; // Load more lists
    const loadMoreLists = async () => {
        if (loadingLists) return;
        setLoadingLists(true);

        try {
            const result = await getAdminData("lijsten", listsData.length, 20);

            if (result.data.length === 0) {
                setListsHasMore(false);
            } else {
                setListsData((prevData) => [...prevData, ...result.data]);
                setListsHasMore(result.hasMore);
                setListsTotal(result.total);

                // Merge user maps
                setUserMapById((prev) => ({ ...prev, ...result.userMapById }));
            }
        } catch (error) {
            console.error("Error loading more lists:", error);
            setListsHasMore(false);
        } finally {
            setLoadingLists(false);
        }
    }; // Load more groups
    const loadMoreGroups = async () => {
        if (loadingGroups) return;
        setLoadingGroups(true);

        try {
            const result = await getAdminData("groepen", groupsData.length, 20);

            if (result.data.length === 0) {
                setGroupsHasMore(false);
            } else {
                setGroupsData((prevData) => [...prevData, ...result.data]);
                setGroupsHasMore(result.hasMore);
                setGroupsTotal(result.total);

                // Merge user maps
                setUserMapById((prev) => ({ ...prev, ...result.userMapById }));
            }
        } catch (error) {
            console.error("Error loading more groups:", error);
            setGroupsHasMore(false);
        } finally {
            setLoadingGroups(false);
        }
    };

    // Render user list component
    const renderUserList = () => {
        if (usersData.length === 0 && !usersHasMore) {
            return (
                <div className="p-4 md:p-8 text-center text-gray-400 text-sm md:text-base">
                    Geen gebruikers gevonden.
                </div>
            );
        }

        return (
            <>
                <h1 className="font-extrabold text-xl md:text-2xl pb-4">
                    {usersTotal} gebruikers in db
                </h1>
                <div className="rounded-md overflow-hidden">
                    <InfiniteScroll
                        dataLength={usersData.length}
                        next={loadMoreUsers}
                        hasMore={usersHasMore}
                        loader={
                            <div className="text-center p-4 bg-neutral-800 border border-neutral-700 text-sm md:text-base">
                                Laden...
                            </div>
                        }
                        scrollThreshold={0.8}
                        style={{ overflow: "visible" }}
                    >
                        <div className="border w-full md:w-33/34 border-neutral-700 rounded-md overflow-hidden bg-neutral-800">
                            {usersData.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex flex-col md:flex-row md:items-center border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-3 md:p-4 hover:bg-neutral-700 transition-all gap-3"
                                >
                                    <Link
                                        href={`/home/viewuser/${user.id}`}
                                        className="flex-1 min-w-0"
                                    >
                                        <div className="flex items-center cursor-pointer">
                                            <div className="mr-3 md:mr-4 shrink-0">
                                                {user?.image ? (
                                                    <img
                                                        src={user.image}
                                                        alt={`de profielfoto van ${user.name}`}
                                                        width={32}
                                                        height={32}
                                                        className="w-8 h-8 md:w-10 md:h-10 rounded-full"
                                                    />
                                                ) : (
                                                    <Jdenticon value={user?.name} size={32} className="w-8 h-8 md:w-10 md:h-10" />
                                                )}
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <h3 className="font-medium text-base md:text-lg truncate">
                                                    {user.name}
                                                    {user.id === currentUserId ? " (jij)" : ""}
                                                    {user?.role === "admin" ? " (admin)" : ""}
                                                    <span> </span>
                                                    {user?.forumAllowed ? (
                                                        ""
                                                    ) : (
                                                        <span className="text-xs md:text-sm font-medium me-2 px-2 md:px-2.5 py-0.5 rounded-sm bg-yellow-900 text-yellow-300">
                                                            Forum banned
                                                        </span>
                                                    )}
                                                    {user?.loginAllowed ? (
                                                        ""
                                                    ) : (
                                                        <span className="text-xs md:text-sm font-medium me-2 px-2 md:px-2.5 py-0.5 rounded-sm bg-red-900 text-red-300">
                                                            Banned
                                                        </span>
                                                    )}
                                                </h3>
                                                <h3 className="text-xs md:text-sm truncate">email: {user?.email}</h3>
                                                <span className="text-xs md:text-sm">
                                                    {user.forumAllowed
                                                        ? ""
                                                        : ` reden: ${user.forumBanReason || "geen reden opgegeven"
                                                        }`}
                                                    {!user.forumAllowed && !user.loginAllowed ? ", " : ""}
                                                    {!user.loginAllowed && user.forumAllowed
                                                        ? " reden: "
                                                        : ""}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="flex flex-wrap items-center gap-2 md:space-x-4 md:gap-0">
                                        {!user.forumAllowed ? (
                                            <BanButton
                                                userId={user.id}
                                                text="unban van forum"
                                                platform={false}
                                                unban={true}
                                            />
                                        ) : (
                                            <BanButton
                                                userId={user.id}
                                                text="ban van forum"
                                                platform={false}
                                                unban={false}
                                            />
                                        )}
                                        {!user.loginAllowed ? (
                                            <BanButton
                                                userId={user.id}
                                                text="unban van site"
                                                platform={true}
                                                unban={true}
                                            />
                                        ) : (
                                            <BanButton
                                                userId={user.id}
                                                text="ban van site"
                                                platform={true}
                                                unban={false}
                                            />
                                        )}
                                        <ResetPasswordButton userId={user.id} />
                                        <DeleteUserButton userId={user.id} />
                                        <ImpersonateUserButton
                                            userId={user.id}
                                            userName={user.name}
                                        />
                                        <SendNotificationButton
                                            userId={user.id}
                                            userName={user.name}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </InfiniteScroll>
                </div>
            </>
        );
    };

    // Render lists tab component
    const renderListsList = () => {
        if (listsData.length === 0 && !listsHasMore) {
            return (
                <div className="p-4 md:p-8 text-center text-gray-400 text-sm md:text-base">
                    Geen lijsten gevonden.
                </div>
            );
        }

        return (
            <>
                <h1 className="font-extrabold text-xl md:text-2xl py-4">
                    {listsTotal} lijsten in db
                </h1>
                <div className="rounded-md overflow-hidden">
                    <InfiniteScroll
                        dataLength={listsData.length}
                        next={loadMoreLists}
                        hasMore={listsHasMore}
                        loader={
                            <div className="text-center p-4 bg-neutral-800 border border-neutral-700 text-sm md:text-base">
                                Laden...
                            </div>
                        }
                        scrollThreshold={0.8}
                        style={{ overflow: "visible" }}
                    >
                        <div className="border w-full md:w-33/34 border-neutral-700 rounded-md overflow-hidden bg-neutral-800">
                            {listsData.map((list) => (
                                <div
                                    key={list.list_id}
                                    className="relative flex flex-col sm:flex-row border-b border-neutral-700 bg-neutral-800 last:border-b-0 p-3 md:p-4 hover:bg-neutral-700 transition-all gap-3"
                                >
                                    <Link
                                        href={`/learn/viewlist/${list.list_id}`}
                                        className="flex-1 min-w-0"
                                    >
                                        <div className="flex items-center cursor-pointer">
                                            <div className="mr-3 md:mr-4 shrink-0">
                                                {list.subject && (
                                                    <Image
                                                        src={getSubjectIcon(list.subject)}
                                                        alt={getSubjectName(list.subject) || list.subject}
                                                        width={32}
                                                        height={32}
                                                        className="h-8 w-8 md:h-10 md:w-10"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex flex-col flex-1 min-w-0">
                                                <h3 className="font-medium text-base md:text-lg">
                                                    <span className="wrap-break-word">{list.name}</span>
                                                    {list.published ? (
                                                        ""
                                                    ) : (
                                                        <span className="ml-2 text-xs md:text-sm font-medium px-2 md:px-2.5 py-0.5 rounded-sm bg-amber-600/20 text-amber-500 border border-amber-600/50">
                                                            Concept
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-xs md:text-sm text-gray-400 truncate">
                                                    Gemaakt door:{" "}
                                                    {userMapById[list.creator]?.name || list.creator} •
                                                    {Array.isArray(list.data) && list.data.length === 1
                                                        ? " 1 woord"
                                                        : ` ${Array.isArray(list.data) ? list.data.length : 0
                                                        } woorden`}
                                                    {list.subject && (
                                                        <>
                                                            {" "}
                                                            • {getSubjectName(list.subject) || list.subject}
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="shrink-0 sm:self-center">
                                        <DeleteListButton
                                            listId={list.list_id}
                                            isCreator={true}
                                            customText="Verwijder"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </InfiniteScroll>
                </div>
            </>
        );
    };

    // Render groups tab component
    const renderGroupList = () => {
        if (groupsData.length === 0 && !groupsHasMore) {
            return (
                <div className="p-4 md:p-8 text-center text-gray-400 text-sm md:text-base">
                    Geen groepen gevonden.
                </div>
            );
        }

        return (
            <>
                <h1 className="font-extrabold text-xl md:text-2xl py-4">
                    {groupsTotal} groepen in db
                </h1>
                <div className="rounded-md">
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
                        <div className="space-y-4">
                            {groupsData.map((groep) => {
                                const memberCount =
                                    groep.members && typeof groep.members === "object"
                                        ? Object.keys(groep.members).length
                                        : 0;

                                const listCount =
                                    groep.listsAdded && Array.isArray(groep.listsAdded)
                                        ? groep.listsAdded.length
                                        : 0;

                                return (
                                    <div
                                        key={groep.groupId}
                                        className="tile relative bg-neutral-800 hover:bg-neutral-700 transition-colors text-white font-bold py-3 px-3 md:py-2 md:px-6 rounded-lg min-h-20 h-auto flex items-center justify-between cursor-pointer"
                                    >
                                        <Link
                                            href={`/learn/group/${groep.groupId}`}
                                            className="flex-1 flex items-center min-w-0"
                                        >
                                            <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                                <div className="shrink-0">
                                                    <Jdenticon value={groep.name} size={32} className="w-8 h-8 md:w-10 md:h-10" />
                                                </div>
                                                <span className="text-base md:text-lg whitespace-normal wrap-break-word max-w-[40ch] flex flex-col md:flex-row md:items-center">
                                                    <span className="wrap-break-word">{groep.name}</span>
                                                    <div className="flex gap-2 mt-1 md:mt-1 md:pl-2">
                                                        {groep.requiresApproval && (
                                                            <Badge className="bg-blue-600/20 text-blue-400 border border-blue-600/50 text-xs">
                                                                Goedkeuring vereist
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </span>
                                            </div>
                                            <div className="hidden md:flex md:grow"></div>
                                            <div className="hidden sm:flex items-center pr-2">
                                                <span className="text-xs md:text-sm text-neutral-400 whitespace-nowrap">
                                                    {memberCount} {memberCount === 1 ? "lid" : "leden"} •
                                                    {listCount} {listCount === 1 ? "lijst" : "lijsten"}
                                                </span>
                                            </div>
                                        </Link>

                                        {groep.description && (
                                            <div className="hidden md:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[150px] text-center">
                                                <p className="text-sm text-neutral-400 line-clamp-1">
                                                    {groep.description}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-neutral-700 hover:bg-neutral-600 transition-colors shrink-0">
                                            <DeleteGroupButton groupId={groep.groupId} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </InfiniteScroll>
                </div>
            </>
        );
    };

    const tabs: TabItem[] = [
        {
            id: "algemeen",
            label: (
                <div className="flex items-center gap-2">
                    <Settings size={16} />
                    <span className="hidden sm:inline">Algemeen</span>
                </div>
            ),
            content: <AlgemeenTabContent />,
        },
        {
            id: "gebruikers",
            label: (
                <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span className="hidden sm:inline">Gebruikers</span>
                </div>
            ),
            content: renderUserList(),
        },
        {
            id: "lijsten",
            label: (
                <div className="flex items-center gap-2">
                    <ListTodo size={16} />
                    <span className="hidden sm:inline">Lijsten</span>
                </div>
            ),
            content: renderListsList(),
        },
        {
            id: "groepen",
            label: (
                <div className="flex items-center gap-2">
                    <School size={16} />
                    <span className="hidden sm:inline">Groepen</span>
                </div>
            ),
            content: renderGroupList(),
        },
        {
            id: "jwe",
            label: <span className="hidden sm:inline">JWE decodeerder</span>,
            content: (
                <>
                    <div className="mt-6">
                        <JweDecoderWrapper />
                    </div>
                </>
            ),
        },
    ];

    // Determine the base route dynamically
    let baseRoute = "/admin";

    return (
        <div className="py-4 md:py-6 px-3 md:pl-6">
            <div className="flex items-center">
                <h1 className="text-3xl md:text-4xl font-extrabold mb-4">admin</h1>
                <div className="grow"></div>
                <div className="w-4" />
            </div>
            <Tabs
                tabs={tabs}
                defaultActiveTab={defaultActiveTab}
                withRoutes={true}
                baseRoute={baseRoute}
                renderContent={renderContent} // Pass down renderContent
            />
        </div>
    );
}
