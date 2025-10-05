import { NextResponse } from 'next/server'

function createNotFoundResponse() {
    return NextResponse.json(
        { error: 'Not Found', message: 'Endpoint bestaat niet' },
        { status: 404 }
    )
}

// Export route handlers directly
export const GET = () => createNotFoundResponse()
export const POST = () => createNotFoundResponse()
export const PUT = () => createNotFoundResponse()
export const DELETE = () => createNotFoundResponse()
export const PATCH = () => createNotFoundResponse()
export const OPTIONS = () => createNotFoundResponse()
export const HEAD = () => createNotFoundResponse()