import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { getUserFromSession } from '@/utils/auth/auth'
import { cookies } from 'next/headers'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromSession(
      (await cookies()).get('polarlearn.session-id')?.value as string
    )

    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const listId = params.id
    const body = await request.json()
    const { flipQuestionLang } = body

    // Get current user data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { list_data: true }
    })

    const listData = userData?.list_data as any || {}

    // Initialize prefs structure if it doesn't exist
    if (!listData.prefs) {
      listData.prefs = {}
    }

    if (!listData.prefs[listId]) {
      listData.prefs[listId] = {}
    }

    // Update the specific preference
    listData.prefs[listId].flipQuestionLang = Boolean(flipQuestionLang)

    // Save back to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        list_data: listData
      }
    })

    return NextResponse.json({
      success: true,
      flipQuestionLang: listData.prefs[listId].flipQuestionLang
    })
  } catch (error) {
    console.error('Error updating list preferences:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het opslaan' },
      { status: 500 }
    )
  }
}
