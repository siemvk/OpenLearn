import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/utils/auth/auth";
import { prisma } from "@/utils/prisma";
import { Prisma } from "@prisma/client";
import { Embed, Webhook } from '@vermaysha/discord-webhook'

async function sendDiscordEmbed(embed: Embed) {
  try {
    const hook = new Webhook(process.env.DISCORD_WEBHOOK || '')
    hook.addEmbed(embed)
    await hook.send()
  } catch (err) {
    console.warn('Failed to send discord embed:', err)
  }
}

// Define notification item type
interface NotificationItem {
  icon: string;
  content: string;
  read: boolean;
  createdAt?: string;
}

interface NotificationData {
  [key: string]: NotificationItem;
}

// Helper function to safely convert JSON to NotificationData
function safelyParseNotificationData(data: any): NotificationData {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {};
  }

  // Return data as NotificationData, assuming it has the right structure
  return data as NotificationData;
}

export async function GET() {
  try {
    const user = await getUserFromSession();

    if (!user) {
      return NextResponse.json({}, { status: 200 });
    }

    // Safe parse of notification data
    const notifications = safelyParseNotificationData(user.notificationData);

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({}, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {

    const body = await request.json();
    const { userId, content, icon = "MessageSquare" } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { error: "Gebruiker ID en inhoud zijn verplicht" },
        { status: 400 }
      );
    }
    const Cuser = await getUserFromSession();

    if (!Cuser) {
      return NextResponse.json({}, { status: 400 });
    }
    if (Cuser.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the user's current notification data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationData: true }
    });

    // If user doesn't exist, throw an error
    if (!user) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Safely parse existing notifications
    const currentNotifications = safelyParseNotificationData(user.notificationData);

    // Create a timestamp to use as unique key
    const timestamp = Date.now().toString();

    // Create the new notification object
    const newNotification = {
      icon,
      content,
      read: false,
      createdAt: new Date().toISOString()
    };

    // Create the updated data object
    const updatedData = {
      ...currentNotifications,
      [timestamp]: newNotification
    };

    // Update user's notification data
    await prisma.user.update({
      where: { id: userId },
      data: {
        notificationData: updatedData as Prisma.InputJsonValue
      }
    });

    // Notify via Discord webhook (include acting admin)
    try {
      let adminIdentifier = 'unknown'
      try {
        const admin = await getUserFromSession();
        if (admin) adminIdentifier = admin.name ?? admin.email ?? admin.id;
      } catch { /* ignore */ }

      const embed = new Embed()
        .setTitle('Admin notificatie gestuurd')
        .setDescription(`Admin ${adminIdentifier} stuurde een notificatie naar gebruiker ${userId}: ${content}`)
        .setColor('#00aaff')
        .setTimestamp()
      await sendDiscordEmbed(embed)
    } catch (webhookErr) {
      console.warn('Failed to send admin notification webhook:', webhookErr)
    }

    return NextResponse.json(
      { success: true, message: "Notificatie succesvol verzonden" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Fout bij het verzenden van notificatie" },
      { status: 500 }
    );
  }
}
