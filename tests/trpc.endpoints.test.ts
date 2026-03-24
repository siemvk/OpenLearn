import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { TRPCError } from "@trpc/server";
import type { AppRouter } from "~/server/main";
import { prisma } from "~/utils/prisma";

type CallerContext = Parameters<AppRouter["createCaller"]>[0];

let appRouter: AppRouter;

const createdUserIds = new Set<string>();
const createdPostIds = new Set<string>();
const createdListIds = new Set<string>();

beforeAll(async () => {
  if (!process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = "12345678901234567890123456789012_test_secret_value";
  }

  ({ appRouter } = await import("~/server/main"));
});

afterEach(async () => {
  await cleanupArtifacts();
});

afterAll(async () => {
  await cleanupArtifacts();
  await prisma.$disconnect();
});

function makeCaller(user?: { id: string; email?: string; name?: string }) {
  const ctx = { prisma, user } as unknown as CallerContext;
  const caller = appRouter.createCaller(ctx);
  return { caller };
}

async function createTestUser() {
  const userId = crypto.randomUUID();
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const user = await prisma.user.create({
    data: {
      id: userId,
      name: `Test User ${unique}`,
      email: `test-${unique}@example.com`,
      emailVerified: true,
    },
  });
  createdUserIds.add(user.id);
  return user;
}

async function cleanupArtifacts() {
  const postIds = [...createdPostIds];
  const listIds = [...createdListIds];
  const userIds = [...createdUserIds];

  if (listIds.length > 0) {
    await prisma.listSessionItemAnswerHistory.deleteMany({
      where: {
        listSessionItem: {
          listSession: {
            listId: { in: listIds },
          },
        },
      },
    });
    await prisma.listSessionItem.deleteMany({
      where: {
        listSession: {
          listId: { in: listIds },
        },
      },
    });
    await prisma.listSession.deleteMany({ where: { listId: { in: listIds } } });
    await prisma.listItemSaved.deleteMany({ where: { listId: { in: listIds } } });
    await prisma.list.deleteMany({ where: { id: { in: listIds } } });
  }

  if (postIds.length > 0) {
    await prisma.forumVote.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.forumPostReply.deleteMany({ where: { postId: { in: postIds } } });
    await prisma.forumPost.deleteMany({ where: { id: { in: postIds } } });
  }

  if (userIds.length > 0) {
    await prisma.listSessionItemAnswerHistory.deleteMany({
      where: {
        listSessionItem: {
          listSession: { userId: { in: userIds } },
        },
      },
    });
    await prisma.forumVote.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.forumPostReply.deleteMany({ where: { authorId: { in: userIds } } });
    await prisma.forumPost.deleteMany({ where: { authorId: { in: userIds } } });
    await prisma.listSessionItem.deleteMany({
      where: {
        listSession: { userId: { in: userIds } },
      },
    });
    await prisma.listSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  createdPostIds.clear();
  createdListIds.clear();
  createdUserIds.clear();
}

describe("tRPC endpoints (integration)", () => {
  describe("user", () => {
    it("returns hello world from user.hello", async () => {
      const { caller } = makeCaller();
      const result = await caller.user.hello();
      expect(result).toBe("hello world");
    });

    it("rejects protected endpoint without user", async () => {
      const { caller } = makeCaller();
      await expect(caller.user.checkSession()).rejects.toBeInstanceOf(TRPCError);
    });
  });

  describe("forum", () => {
    it("queries forum posts with filters", async () => {
      const user = await createTestUser();
      const createdPost = await prisma.forumPost.create({
        data: {
          title: `post-${Date.now()}`,
          content: "Body",
          subject: "js",
          authorId: user.id,
        },
        include: { author: true },
      });
      createdPostIds.add(createdPost.id);

      const { caller } = makeCaller();
      const result = await caller.forum.getPosts({
        subject: "js",
        take: 10,
        skip: 0,
      });

      expect(result.some((post) => post.id === createdPost.id)).toBe(true);
    });

    it("creates a forum post for authenticated user", async () => {
      const user = await createTestUser();

      const { caller } = makeCaller({ id: user.id, email: user.email, name: user.name });
      const created = await caller.forum.makePost({
        title: "Integration title",
        content: "Integration content",
        subject: "js",
      });
      createdPostIds.add(created.id);

      expect(created.authorId).toBe(user.id);

      const persisted = await prisma.forumPost.findUnique({ where: { id: created.id } });
      expect(persisted?.id).toBe(created.id);
    });

    it("prevents creating forum post for unauthenticated user", async () => {
      const { caller } = makeCaller();
      await expect(
        caller.forum.makePost({
          title: "Integration title",
          content: "Integration content",
          subject: "js",
        })
      ).rejects.toBeInstanceOf(TRPCError);
    });
  });

  describe("learn", () => {
    describe("lists", () => {
      it("returns a list from learn. getList", async () => {
        const user = await createTestUser();

        const createdList = await prisma.list.create({
          data: {
            name: `Topwoorden-${Date.now()}`,
            ownerId: user.id,
            listItems: {
              create: [{ vraag: "vraag", antwoord: "antwoord" }],
            },
          },
          include: { listItems: true },
        });
        createdListIds.add(createdList.id);

        const { caller } = makeCaller({ id: user.id, email: user.email, name: user.name });
        const result = await caller.learn.getList({ id: createdList.id });

        expect(result?.id).toBe(createdList.id);
        expect(result?.listItems.length).toBeGreaterThan(0);
      });

      it("prevents access to learn. getList for non-existent list", async () => {
        const user = await createTestUser();

        const { caller } = makeCaller({ id: user.id, email: user.email, name: user.name });
        const result = await caller.learn.getList({ id: "non-existent-list-id" });

        expect(result).toBeNull();
      });

      it("creates a list with learn. makeList", async () => {
        const user = await createTestUser();

        const { caller } = makeCaller({ id: user.id, email: user.email, name: user.name });
        const created = await caller.learn.makeList({
          name: `Topwoorden-${Date.now()}`,
          list: [{ vraag: "vraag", antwoord: "antwoord" }],
        });
        createdListIds.add(created.id);

        expect(created.ownerId).toBe(user.id);
        expect(created.listItems.length).toBe(1);

        const persisted = await prisma.list.findUnique({
          where: { id: created.id },
          include: { listItems: true },
        });
        expect(persisted?.id).toBe(created.id);
        expect(persisted?.listItems.length).toBe(1);
      });
    });

    describe("sessions", () => {
      describe("startLearnSession", () => {
        it("starts a learn session with learn. startLearnSession", async () => {
          const user = await createTestUser();

          const createdList = await prisma.list.create({
            data: {
              name: `Topwoorden-${Date.now()}`,
              ownerId: user.id,
              listItems: {
                create: [{ vraag: "vraag", antwoord: "antwoord" }],
              },
            },
            include: { listItems: true },
          });
          createdListIds.add(createdList.id);

          const { caller } = makeCaller({ id: user.id, email: user.email, name: user.name });
          const session = await caller.learn.startLearnSession({ listId: createdList.id });

          expect(session.userId).toBe(user.id);
          expect(session.listId).toBe(createdList.id);
          expect(session.listSessionItems.length).toBe(1);
          expect(session.listSessionItems[0].vraag).toBe("vraag");
          expect(session.listSessionItems[0].antwoord).toBe("antwoord");
        });

        it("prevents starting a learn session for non-existent list", async () => {
          const user = await createTestUser();

          const { caller } = makeCaller({ id: user.id, email: user.email, name: user.name });
          await expect(
            caller.learn.startLearnSession({ listId: "non-existent-list-id" })
          ).rejects.toBeInstanceOf(TRPCError);
        });

        it("prevents starting a learn session for empty list", async () => {
          const user = await createTestUser();

          const createdList = await prisma.list.create({
            data: {
              name: `Empty List-${Date.now()}`,
              ownerId: user.id,
            },
          });
          createdListIds.add(createdList.id);

          const { caller } = makeCaller({ id: user.id, email: user.email, name: user.name });
          await expect(
            caller.learn.startLearnSession({ listId: createdList.id })
          ).rejects.toBeInstanceOf(TRPCError);
        });
      });
      describe("updateLearnSessionItem", () => {

        it("updates learn session item with learn.updateLearnSessionItem", async () => {
          const user = await createTestUser();

          const createdList = await prisma.list.create({
            data: {
              name: `Topwoorden-${Date.now()}`,
              ownerId: user.id,
              listItems: {
                create: [{ vraag: "vraag", antwoord: "antwoord" }],
              },
            },
            include: { listItems: true },
          });
          createdListIds.add(createdList.id);

          const { caller } = makeCaller({ id: user.id, email: user.email, name: user.name });
          const session = await caller.learn.startLearnSession({ listId: createdList.id });

          const itemToUpdate = session.listSessionItems[0];
          const updated = await caller.learn.updateLearnSessionItem({
            listSessionIdItem: itemToUpdate.id,
            goed: true,
            round: 1,
            antwoord: "antwoord",
          });
          expect(updated.id).toBe(itemToUpdate.id);

          const persisted = await prisma.listSessionItem.findUnique({
            where: { id: itemToUpdate.id },
            include: { listSessionItemAnswerHistories: true },
          });
          expect(persisted?.listSessionItemAnswerHistories.length).toBe(1);
          expect(persisted?.listSessionItemAnswerHistories[0].round).toBe(1);
          expect(persisted?.listSessionItemAnswerHistories[0].goed).toBe(true);
          expect(persisted?.listSessionItemAnswerHistories[0].antwoord).toBe("antwoord");
        });
        it("prevent updating learn sessions not belonging to user with learn.updateLearnSessionItem", async () => {
          const user1 = await createTestUser();
          const user2 = await createTestUser();

          const createdList = await prisma.list.create({
            data: {
              name: `Topwoorden-${Date.now()}`,
              ownerId: user1.id,
              listItems: {
                create: [{ vraag: "vraag", antwoord: "antwoord" }],
              },
            },
            include: { listItems: true },
          });
          createdListIds.add(createdList.id);

          const caller2 = makeCaller({ id: user2.id, email: user2.email, name: user2.name }).caller;
          const caller1 = makeCaller({ id: user1.id, email: user1.email, name: user1.name }).caller;
          const session = await caller2.learn.startLearnSession({ listId: createdList.id });

          const itemToUpdate = session.listSessionItems[0];
          await expect(
            caller1.learn.updateLearnSessionItem({
              listSessionIdItem: itemToUpdate.id,
              goed: true,
              round: 1,
              antwoord: "antwoord",
            })
          ).rejects.toBeInstanceOf(TRPCError);
        });

        it("prevents updating non-existent learn session item with learn.updateLearnSessionItem", async () => {
          const user = await createTestUser();

          const { caller } = makeCaller({ id: user.id, email: user.email, name: user.name });
          await expect(
            caller.learn.updateLearnSessionItem({
              listSessionIdItem: "non-existent-item-id",
              goed: true,
              round: 1,
              antwoord: "antwoord",
            })
          ).rejects.toBeInstanceOf(TRPCError);
        });
      });
    });
  });
});
