'use server'

import { prisma } from '@/utils/prisma'

export async function getSystemMessage() {
  try {
    const cfg = await prisma.config.findUnique({ where: { key: 'systemMessage' } })
    if (!cfg) return { message: '', color: '#2563eb' }
    try {
      const parsed = JSON.parse(cfg.value)
      return { message: parsed.message || '', color: parsed.color || '#2563eb' }
    } catch {
      return { message: cfg.value, color: '#2563eb' }
    }
  } catch (e) {
    console.error('getSystemMessage failed', e)
    throw new Error('Failed to fetch system message')
  }
}

export async function setSystemMessage({ message, color }: { message: string; color: string }) {
  try {
    const value = JSON.stringify({ message, color })
    await prisma.config.upsert({
      where: { key: 'systemMessage' },
      update: { value },
      create: { key: 'systemMessage', value },
    })
    return { success: true }
  } catch (e) {
    console.error('setSystemMessage failed', e)
    throw new Error('Failed to save system message')
  }
}

export async function clearSystemMessage() {
  try {
    await prisma.config.delete({ where: { key: 'systemMessage' } });
  } catch (e: any) {
    // If it doesn't exist, ignore; otherwise rethrow
    if (e?.code === 'P2025') return; // Prisma record not found
    console.error('clearSystemMessage failed', e)
    throw new Error('Failed to clear system message')
  }
}
