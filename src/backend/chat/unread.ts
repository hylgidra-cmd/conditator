import { db } from "@/backend/db";
import type { Role } from "@prisma/client";

export async function getUnreadMessageCount(
  userId: string,
  role: Role,
): Promise<number> {
  if (role === "ADMIN") {
    return db.supportMessage.count({
      where: {
        senderRole: { not: "ADMIN" },
        readAt: null,
      },
    });
  }

  if (role === "STUDENT") {
    const [chatUnread, supportUnread] = await Promise.all([
      db.chatMessage.count({
        where: {
          senderId: { not: userId },
          readAt: null,
          conversation: { studentId: userId },
        },
      }),
      db.supportMessage.count({
        where: {
          senderId: { not: userId },
          readAt: null,
          thread: { userId },
        },
      }),
    ]);
    return chatUnread + supportUnread;
  }

  const company = await db.company.findFirst({
    where: { OR: [{ userId }, { members: { some: { userId } } }] },
    select: { id: true },
  });

  const [chatUnread, supportUnread] = await Promise.all([
    company
      ? db.chatMessage.count({
          where: {
            senderId: { not: userId },
            readAt: null,
            conversation: { companyId: company.id },
          },
        })
      : Promise.resolve(0),
    db.supportMessage.count({
      where: {
        senderId: { not: userId },
        readAt: null,
        thread: { userId },
      },
    }),
  ]);

  return chatUnread + supportUnread;
}
