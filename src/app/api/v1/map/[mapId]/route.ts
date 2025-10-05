import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserFromSession } from '@/utils/auth/auth';
import { prisma } from '@/utils/prisma';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params: _params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const body = await request.json();
    const { name, isPublic } = body;

    const sessionId = (await cookies()).get('polarlearn.session-id')?.value;
    const user = await getUserFromSession(sessionId as string);

    if (!user || !user.name) {
      return NextResponse.json({ error: 'Je moet ingelogd zijn om een map aan te maken' }, { status: 401 });
    }

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Mapnaam is verplicht' }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'Mapnaam mag maximaal 100 karakters bevatten' }, { status: 400 });
    }

    const newMapId = uuidv4();

    await prisma.map.create({
      data: {
        id: newMapId,
        name: name.trim(),
        creator: user.name,
        lists: [],
        public: isPublic || false,
        image: null
      }
    });

    // Revalidate relevant paths
    revalidatePath('/learn/maps');
    revalidatePath(`/learn/map/${newMapId}`);
    revalidatePath('/home/start');

    return NextResponse.json({ success: true, mapId: newMapId });
  } catch (error) {
    console.error('Error creating map:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het aanmaken van de map' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ mapId: string }> }
) {
  try {
    const { mapId } = await params;

    // Get current user
    const sessionId = (await cookies()).get('polarlearn.session-id')?.value;
    const user = await getUserFromSession(sessionId as string);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the map
    const map = await prisma.map.findUnique({
      where: { id: mapId }
    });

    if (!map) {
      return NextResponse.json({ error: 'Map not found' }, { status: 404 });
    }

    // Check if user is the creator
    if (map.creator !== user.name) {
      return NextResponse.json({ error: 'Alleen de maker van de map kan zijn/haar map verwijderen' }, { status: 403 });
    }

    // Delete the map (no need to delete related records since lists are just referenced in the lists array)
    await prisma.map.delete({
      where: { id: mapId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting map:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
