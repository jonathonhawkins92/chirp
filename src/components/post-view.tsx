import Link from "next/link";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import type { RouterOutputs } from "~/utils/api";

dayjs.extend(relativeTime);

type PostWithAuthor = RouterOutputs["posts"]["getAll"][number];

export const PostView = ({ post, author }: PostWithAuthor) => {
    return (
        <div className="flex w-full gap-3 border-b border-slate-400 p-4">
            <Link href={`/@${author.username}`}>
                <Image
                    src={author.profileImageUrl}
                    alt={`@${author.username}'s profile image`}
                    className="h-14 w-14 rounded-full"
                    width={56}
                    height={56}
                />
            </Link>
            <div className="flex flex-col">
                <div className="flex gap-1 text-slate-300">
                    <Link href={`/@${author.username}`}>
                        <span>{`@${author.username}`}</span>
                    </Link>
                    <span>·</span>
                    <Link href={`/post/${post.id}`}>
                        <span className="font-thin">
                            {dayjs(post.createdAt).fromNow()}
                        </span>
                    </Link>
                </div>
                <span className="text-2xl">{post.content}</span>
            </div>
        </div>
    );
};

