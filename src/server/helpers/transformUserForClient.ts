import { TRPCError } from "@trpc/server";
import type { User } from "@clerk/nextjs/dist/api";

export const transformUserForClient = (user: User) => {
    if (!user.username) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
        });
    }

    return {
        id: user.id,
        username: user.username,
        profileImageUrl: user.profileImageUrl,
    };
};

