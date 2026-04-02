import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Page = async () => {
    const user = await getCurrentUser();
    if (!user || !user.id || !user.name) return null;

    return (
        <>
            <h3>Interview generation</h3>

            <Agent
                userName={user.name}
                userId={user.id}
                profileImage={user?.profileURL}
                type="generate"
            />
        </>
    );
};

export default Page;