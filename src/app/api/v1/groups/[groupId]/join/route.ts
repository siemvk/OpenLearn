import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/utils/auth/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/utils/prisma';
import { revalidatePath } from 'next/cache';

// POST handler to join a group
export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  try {
    const session = await getUserFromSession(
      (await cookies()).get("polarlearn.session-id")?.value as string
    );

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Je moet ingelogd zijn om lid te worden" },
        { status: 401 }
      );
    }

    // Get the group
    const group = await prisma.group.findUnique({
      where: { groupId },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Groep niet gevonden" },
        { status: 404 }
      );
    }

    // Get current members and pending approvals
    const members = group.members ?
      (Array.isArray(group.members) ? group.members : []) : [];

    // Check if user is already a member
    if (members.includes(session.id)) {
      return NextResponse.json(
        { success: false, error: "Je bent al lid van deze groep" },
        { status: 400 }
      );
    }

    // Handle groups that require approval
    if (group.requiresApproval) {
      // Get current pending approvals
      let pendingApprovals: string[] = [];

      if (group.toBeApproved) {
        if (Array.isArray(group.toBeApproved)) {
          pendingApprovals = group.toBeApproved as string[];
        } else if (typeof group.toBeApproved === 'object') {
          pendingApprovals = Object.keys(group.toBeApproved as object);
        }
      }

      // Check if user already has a pending request
      if (pendingApprovals.includes(session.id)) {
        return NextResponse.json(
          { success: false, error: "Je hebt al een verzoek ingediend om lid te worden" },
          { status: 400 }
        );
      }

      // Add user to pending approvals
      const updatedPendingApprovals = [...pendingApprovals, session.id];

      await prisma.group.update({
        where: { groupId },
        data: { toBeApproved: updatedPendingApprovals }
      });

      return NextResponse.json({
        success: true,
        message: "Je verzoek is ingediend en wacht op goedkeuring"
      });
    } else {
      // If no approval required, add user directly to members
      const updatedMembers = [...members, session.id];

      await prisma.group.update({
        where: { groupId },
        data: { members: updatedMembers }
      });

      // Update user's inGroups list
      const user = await prisma.user.findUnique({
        where: { id: session.id }
      });

      if (user) {
        const inGroups = (user.inGroups as string[]) || [];
        const updatedInGroups = [...new Set([...inGroups, groupId])];
        await prisma.user.update({
          where: { id: session.id },
          data: { inGroups: updatedInGroups }
        });
      }

      revalidatePath('/learn/groups');
      revalidatePath('/home/start');

      return NextResponse.json({
        success: true,
        message: "Je bent nu lid van deze groep"
      });
    }
  } catch (error) {
    console.error("Error joining group:", error);
    return NextResponse.json(
      { success: false, error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}

// DELETE handler to cancel a pending membership request
export async function DELETE(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  try {
    const session = await getUserFromSession(
      (await cookies()).get("polarlearn.session-id")?.value as string
    );

    if (!session || !session.id) {
      return NextResponse.json(
        { success: false, error: "Je moet ingelogd zijn om dit te doen" },
        { status: 401 }
      );
    }

    // Get the group
    const group = await prisma.group.findUnique({
      where: { groupId },
    });

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Groep niet gevonden" },
        { status: 404 }
      );
    }

    // Get current pending approvals
    let pendingApprovals: string[] = [];
    if (group.toBeApproved) {
      if (Array.isArray(group.toBeApproved)) {
        pendingApprovals = group.toBeApproved
          .filter((id): id is string => typeof id === 'string')
          .map(id => id);
      } else if (typeof group.toBeApproved === 'object') {
        pendingApprovals = Object.keys(group.toBeApproved);
      }
    }

    // Check if user has a pending request
    if (!pendingApprovals.includes(session.id)) {
      return NextResponse.json(
        { success: false, error: "Je hebt geen openstaand verzoek voor deze groep" },
        { status: 400 }
      );
    }

    // Remove user from pending approvals
    const updatedPendingApprovals = pendingApprovals.filter(id => id !== session.id);

    // Update the group
    await prisma.group.update({
      where: { groupId },
      data: {
        toBeApproved: updatedPendingApprovals
      }
    });

    return NextResponse.json({
      success: true,
      message: "Je verzoek is ingetrokken"
    });
  } catch (error) {
    console.error("Error canceling group request:", error);
    return NextResponse.json(
      { success: false, error: "Er is een fout opgetreden" },
      { status: 500 }
    );
  }
}