import type { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import { LoadingPage } from "~/components/loading";
import { PostView } from "~/components/post-view";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";

const ProfileFeed = ({ userId }: { userId: string }) => {
    const {
        data: posts,
        isLoading,
        isError,
    } = api.posts.getPostsByUserId.useQuery({ userId });

    if (isLoading) return <LoadingPage />;
    if (isError) return <div>Whoops!</div>;

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

const SinglePostPage: NextPage<{ username: string }> = ({ username }) => {
    const { data: profile } = api.profile.getUserByUsername.useQuery({
        username,
    });

    if (!profile) return <div>Whoops!</div>;

    return (
        <>
            <Head>
                <title>{`@${profile.username}`}</title>
            </Head>
            <PageLayout>
                <header>
                    <div className="h-32 bg-slate-400" />
                    <div className="relative w-full border-b border-slate-400">
                        <Image
                            src={profile.profileImageUrl}
                            alt={`@${profile.username}'s profile picture`}
                            className="absolute top-0 left-0 -mt-16 ml-4 h-32 w-32 rounded-full border-4 border-black bg-black"
                            width={128}
                            height={126}
                        />
                        <div className="h-16" />
                        <div className="p-4 text-2xl font-bold">
                            {`@${profile.username}`}
                        </div>
                    </div>
                </header>
                <section>
                    <ProfileFeed userId={profile.id} />
                </section>
            </PageLayout>
        </>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const ssg = generateSSGHelper();

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

export default SinglePostPage;

