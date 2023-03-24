import type { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Head from "next/head";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { api } from "~/utils/api";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import superjson from "superjson";
import { PageLayout } from "~/components/layout";

const Profile: NextPage<{ username: string }> = ({ username }) => {
    const { data: profile } = api.profile.getUserByUsername.useQuery({
        username,
    });

    if (!profile) return <div>Whoops!</div>;

    return (
        <>
            <Head>
                <title>{`@${username}`}</title>
            </Head>
            <PageLayout>
                <header>
                    <div className="h-32 bg-slate-400" />
                    <div className="relative w-full border-b border-slate-400">
                        <Image
                            src={profile.profileImageUrl}
                            alt={`@${username}'s profile picture`}
                            className="absolute top-0 left-0 -mt-16 ml-4 h-32 w-32 rounded-full border-4 border-black bg-black"
                            width={128}
                            height={126}
                        />
                        <div className="h-16" />
                        <div className="p-4 text-2xl font-bold">
                            {`@${username}`}
                        </div>
                    </div>
                </header>
            </PageLayout>
        </>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const ssg = createProxySSGHelpers({
        router: appRouter,
        ctx: {
            prisma,
            currentUserId: undefined,
        },
        transformer: superjson,
    });

    const slug = context.params?.slug;

    if (typeof slug !== "string") {
        // TODO: redirect to 404
        throw new Error("No slug");
    }

    const username = slug.slice(1);

    await ssg.profile.getUserByUsername.prefetch({ username });

    return {
        props: {
            trpcState: ssg.dehydrate(),
            username,
        },
    };
};

export const getStaticPaths = () => {
    return { paths: [], fallback: "blocking" };
};

export default Profile;

