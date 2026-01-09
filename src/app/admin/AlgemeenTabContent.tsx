
import { getAdminSettings } from "@/serverActions/adminSettings";
import AlgemeenTabClient from "./AlgemeenTabClient";
import BannerCustomizer from "./BannerCustomizer";

export default async function AlgemeenTabContent() {
    const settings = await getAdminSettings();

    return (
        <>
            <BannerCustomizer />
            <AlgemeenTabClient
                forumEnabled={settings.forumEnabled}
                registrationEnabled={settings.registrationEnabled}
            />
        </>
    );
}
