import { useRef } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { toast } from "react-hot-toast";
import { PageLayout } from "~/components/layout";

dayjs.extend(relativeTime);

export const Avatar = ({
    src,
    alt,
    href,
}: {
    src: string;
    alt: string;
    href?: string;
}) => {
    const avatar = (
        <Image
            src={src}
            alt={alt}
            className="h-14 w-14 rounded-full"
            width={56}
            height={56}
        />
    );
    if (href) {
        return <Link href={href}>{avatar}</Link>;
    }
    return avatar;
};

const CreatePostWizard = () => {
    const { user, isSignedIn } = useUser();
    const input = useRef<null | HTMLInputElement>(null);

    const ctx = api.useContext();

    const { mutate, isLoading } = api.posts.create.useMutation({
        onSuccess() {
            if (!input.current) return;
            input.current.value = "";
            void ctx.posts.getAll.invalidate();
        },
        onError(e) {
            const errorMessage = e.data?.zodError?.fieldErrors.content;
            if (errorMessage) {
                for (const error of errorMessage) {
                    toast.error(error);
                }
            } else if (e.message === "TOO_MANY_REQUESTS") {
                toast.error("You can only post twice a minute, chill out.");
            } else {
                toast.error("Failed to post! Please try again later.");
            }
        },
    });

    if (!isSignedIn) return null;

    return (
        <form
            className="flex w-full items-center gap-3"
            onSubmit={(e) => {
                e.preventDefault();
                if (!input.current) return;
                mutate({
                    content: input.current.value,
                });
            }}
        >
            <Avatar
                src={user.profileImageUrl}
                href={user.username ? `/@${user.username}` : undefined}
                alt="Your profile"
            />

            <input
                className="grow bg-transparent outline-none"
                placeholder="Emojis"
                type="text"
                ref={input}
                disabled={isLoading}
            />
            {!isLoading && (
                <input className="cursor-pointer" type="submit" value="Post" />
            )}
            {isLoading && <LoadingSpinner size={20} />}
        </form>
    );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = ({ post, author }: PostWithUser) => {
    return (
        <div className="flex w-full gap-3 border-b border-slate-400 p-4">
            <Avatar
                src={author.profileImageUrl}
                alt={`@${author.username}'s profile image`}
                href={`/@${author.username}`}
            />
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

const Feed = () => {
    const { data: posts, isLoading, isError } = api.posts.getAll.useQuery();

    if (isLoading) return <LoadingPage />;

    if (isError) return <div>Woops!</div>;

    return (
        <ul>
            {posts.map(({ post, author }) => (
                <li key={post.id}>
                    <PostView post={post} author={author} />
                </li>
            ))}
        </ul>
    );
};

const Home: NextPage = () => {
    api.posts.getAll.useQuery();

    const { isSignedIn, isLoaded: isUserLoaded } = useUser();

    if (!isUserLoaded) return <LoadingPage />;

    return (
        <PageLayout>
            <header className="flex border-b border-slate-400 p-4">
                {!isSignedIn && (
                    <div className="flex justify-center">
                        <SignInButton />
                    </div>
                )}
                {!!isSignedIn && <CreatePostWizard />}
            </header>
            <Feed />
        </PageLayout>
    );
};

export default Home;

