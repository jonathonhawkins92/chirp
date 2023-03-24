import type { User } from "@clerk/nextjs/dist/api";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import {
    createTRPCRouter,
    privateProcedure,
    publicProcedure,
} from "~/server/api/trpc";

// Create a new ratelimiter, that allows 3 requests per 1 minute
const rateLimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    analytics: true,
});

const transformUserToAuthor = (user: User) => {
    return {
        id: user.id,
        username: user.username,
        profileImageUrl: user.profileImageUrl,
    };
};

export const postRouter = createTRPCRouter({
    getAll: publicProcedure.query(async ({ ctx }) => {
        const posts = await ctx.prisma.post.findMany({
            take: 100,
            orderBy: {
                createdAt: "desc",
            },
        });

        const users = await clerkClient.users.getUserList({
            userId: posts.map((post) => post.authorId),
            limit: 100,
        });

        const authors = users.map(transformUserToAuthor);

        return posts.map((post) => {
            const author = authors.find((user) => user.id === post.authorId);
            if (!author || !author.username) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Author for post not found",
                });
            }
            return {
                post,
                author: {
                    ...author,
                    username: author.username,
                },
            };
        });
    }),
    create: privateProcedure
        .input(
            z.object({
                content: z
                    .string()
                    .emoji("Only emojis are allowed")
                    .min(1, "Forgetting something?")
                    .max(255, "Wow boy that's just too long!"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const authorId = ctx.currentUserId;
            const { success } = await rateLimit.limit(authorId);

            if (!success) {
                throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
            }

            const post = await ctx.prisma.post.create({
                data: {
                    authorId,
                    content: input.content,
                },
            });

            return post;
        }),
});

