import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { api } from "~/utils/api";
import { PageLayout } from "~/components/layout";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { PostView } from "~/components/post-view";

const Profile: NextPage<{ id: string }> = ({ id }) => {
    const { data } = api.posts.getById.useQuery({
        id,
    });

    if (!data) return <div>Whoops!</div>;

    return (
        <>
            <Head>
                <title>{`${data.post.content} - @${data.author.username}`}</title>
            </Head>
            <PageLayout>
                <PostView post={data.post} author={data.author} />
            </PageLayout>
        </>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const ssg = generateSSGHelper();

    const id = context.params?.id;

    if (typeof id !== "string") {
        // TODO: redirect to 404
        throw new Error("No post id");
    }

    await ssg.posts.getById.prefetch({ id });

    return {
        props: {
            trpcState: ssg.dehydrate(),
            id,
        },
    };
};

export const getStaticPaths = () => {
    return { paths: [], fallback: "blocking" };
};

export default Profile;

