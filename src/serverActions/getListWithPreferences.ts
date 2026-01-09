"use server";

import { getUserFromSession } from "@/utils/auth/auth";
import { cookies } from "next/headers";
import { prisma } from "@/utils/prisma";

export async function getListWithPreferences(listId: string) {
  try {
    const sessionCookie = (await cookies()).get("polarlearn.session-id");

    if (!sessionCookie?.value) {
      return null;
    }

    const sessionUser = await getUserFromSession(sessionCookie.value);

    if (!sessionUser || sessionUser.loginAllowed === false) {
      return null;
    }

    // Get the list data
    const listdata = await prisma.practice.findFirst({
      where: { list_id: listId },
    });

    if (!listdata) {
      return null;
    }

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        list_data: true
      }
    });

    let flipQuestionLang = false;
    if (user?.list_data) {
      const listData = user.list_data as any;
      if (listData.prefs && listData.prefs[listId]) {
        flipQuestionLang = listData.prefs[listId].flipQuestionLang || false;
      }
    }

    // Transform the data correctly and apply flip if needed
    let rawListData = listdata.data && Array.isArray(listdata.data)
      ? listdata.data.map((item: any) => ({
        vraag: item["1"] || "",
        antwoord: item["2"] || ""
      }))
      : [];

    // Apply flip transformation server-side if needed
    if (flipQuestionLang) {
      rawListData = rawListData.map(item => ({
        vraag: item.antwoord,
        antwoord: item.vraag
      }));
    }

    return {
      listdata,
      rawListData,
      flipQuestionLang,
      listDataProps: {
        lang_from: flipQuestionLang ? listdata.lang_to : listdata.lang_from,
        lang_to: flipQuestionLang ? listdata.lang_from : listdata.lang_to
      }
    };
  } catch (error) {
    console.error('Error loading list with preferences:', error);
    return null;
  }
}
