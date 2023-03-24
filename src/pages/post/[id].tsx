import type { NextPage } from "next";
import Head from "next/head";
import { PageLayout } from "~/components/layout";

import { LoadingPage } from "~/components/loading";
import { api } from "~/utils/api";

const SinglePostPage: NextPage = () => {
    const {
        data: profile,
        isLoading,
        isError,
    } = api.profile.getUserByUsername.useQuery({
        username: "jonathonhawkins92",
    });

    if (isLoading) return <LoadingPage />;
    if (isError) return <div>Whoops!</div>;

    return (
        <>
            <Head>
                <title>Post</title>
            </Head>
            <PageLayout>
                SinglePostPage
                {profile.username}
            </PageLayout>
        </>
    );
};

export default SinglePostPage;

