import { prisma } from "@/utils/prisma";

export async function setBannerConfig({ text, color }: { text: string; color: string }) {
  const value = JSON.stringify({ message: text, color });
  await prisma.config.upsert({
    where: { key: "systemMessage" },
    update: { value },
    create: { key: "systemMessage", value },
  });
}

export async function getBannerConfig() {
  const config = await prisma.config.findUnique({ where: { key: "systemMessage" } });
  if (!config) return { text: '', color: '#2563eb' };
  try {
    const parsed = JSON.parse(config.value);
    return { text: parsed.message || '', color: parsed.color || '#2563eb' };
  } catch {
    return { text: config.value, color: '#2563eb' };
  }
}
