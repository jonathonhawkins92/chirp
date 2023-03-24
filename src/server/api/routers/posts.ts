import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { transformUserForClient } from "~/server/helpers/transformUserForClient";

import {
    createTRPCRouter,
    privateProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import type { Post } from "@prisma/client";

// Create a new ratelimiter, that allows 3 requests per 1 minute
const rateLimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    analytics: true,
});

const addAuthorDataToPost = async (posts: Post[], authorIds: string[]) => {
    const users = await clerkClient.users.getUserList({
        userId: authorIds,
        limit: 100,
    });

    const authors = users.map(transformUserForClient);

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
};

export const postRouter = createTRPCRouter({
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const post = await ctx.prisma.post.findUnique({
                where: { id: input.id },
            });
            if (!post) {
                throw new TRPCError({ code: "NOT_FOUND" });
            }

            const transformedPost = await addAuthorDataToPost(
                [post],
                [post.authorId]
            );

            return transformedPost[0];
        }),

    getAll: publicProcedure.query(async ({ ctx }) => {
        const posts = await ctx.prisma.post.findMany({
            take: 100,
            orderBy: {
                createdAt: "desc",
            },
        });

        return addAuthorDataToPost(
            posts,
            posts.map((post) => post.authorId)
        );
    }),

    getPostsByUserId: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            const posts = await ctx.prisma.post.findMany({
                where: { authorId: input.userId },
                take: 100,
                orderBy: {
                    createdAt: "desc",
                },
            });

            return addAuthorDataToPost(posts, [input.userId]);
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

