'use server'

import { getUserFromSession } from '@/utils/auth/auth'
import { prisma } from '@/utils/prisma'

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
  let adminIdentifier = 'unknown'
  try {
    const admin = await getUserFromSession()
    if (admin) adminIdentifier = admin.name ?? admin.email ?? admin.id
    const value = JSON.stringify({ message, color })
    await prisma.config.upsert({
      where: { key: 'systemMessage' },
      update: { value },
      create: { key: 'systemMessage', value },
    })
    const embed = new Embed()
      .setTitle('Systeembanner gezet')
      .setDescription(`Met tekst: ${message}\nKleur: ${color}\nActie door: ${adminIdentifier}`)
      .setColor('#ff9900')
      .setTimestamp()
    await sendDiscordEmbed(embed)
    return { success: true }
  } catch (e) {
    console.error('setSystemMessage failed', e)
    throw new Error('Failed to save system message')
  }
}

export async function clearSystemMessage() {
  let adminIdentifier = 'unknown'
  try {
    await prisma.config.delete({ where: { key: 'systemMessage' } });
    const admin = await getUserFromSession()
    if (admin) adminIdentifier = admin.name ?? admin.email ?? admin.id
    const embed = new Embed()
      .setTitle('Systeembanner verwijderd')
      .setDescription(`Systeembanner is verwijderd.\nActie door: ${adminIdentifier}`)
      .setColor('#ff9900')
      .setTimestamp()
    await sendDiscordEmbed(embed)
  } catch (e: any) {
    // If it doesn't exist, ignore; otherwise rethrow
    if (e?.code === 'P2025') return; // Prisma record not found
    console.error('clearSystemMessage failed', e)
    throw new Error('Failed to clear system message')
  }
}
