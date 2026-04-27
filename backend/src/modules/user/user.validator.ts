import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).optional(),
    username: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/).optional(),
    bio: z.string().max(500).optional(),
    profilePicture: z.string().nullable().optional(),
  }),
});

export const searchUsersSchema = z.object({
  query: z.object({
    q: z.string().min(1).max(100),
  }),
});

export const getPublicProfileSchema = z.object({
  params: z.object({
    userId: z.coerce.number().int().positive(),
  }),
});
