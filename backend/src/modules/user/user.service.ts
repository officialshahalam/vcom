import { prisma } from "../../configs/prisma/client";

export const userService = {
  getCurrentProfile: async (userId: number) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        mobileNumber: true,
        email: true,
        profilePicture: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
      },
    }),

  updateProfile: async (
    userId: number,
    input: { fullName?: string; username?: string; bio?: string; profilePicture?: string | null },
  ) =>
    prisma.user.update({
      where: { id: userId },
      data: {
        fullName: input.fullName,
        username: input.username,
        bio: input.bio,
        profilePicture: input.profilePicture,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        mobileNumber: true,
        email: true,
        profilePicture: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
      },
    }),

  searchUsers: async (currentUserId: number, q: string) =>
    prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { mobileNumber: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        profilePicture: true,
        isOnline: true,
        lastSeen: true,
      },
      take: 20,
    }),

  getPublicProfile: async (userId: number) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        username: true,
        profilePicture: true,
        isOnline: true,
        lastSeen: true,
      },
    }),
};
