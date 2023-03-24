import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import superjson from "superjson";

export const generateSSGHelper = ({
    currentUserId,
}: {
    currentUserId?: string;
} = {}) => {
    return createProxySSGHelpers({
        router: appRouter,
        ctx: {
            prisma,
            currentUserId,
        },
        transformer: superjson,
    });
};

