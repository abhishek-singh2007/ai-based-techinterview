import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";
import { Button } from "@/components/ui/button";
import { signOutAndRedirect } from "@/lib/actions/auth.action";

const Layout = async ({ children }: { children: ReactNode }) => {
    const isUserAuthenticated = await isAuthenticated();
    if (!isUserAuthenticated) redirect("/sign-in");

    return (
        <div className="root-layout">
            <nav className="flex items-center justify-between gap-4">
                <Link href="/" className="flex items-center gap-2">
                    <Image src="/logo.svg" alt="MockMate Logo" width={38} height={32} />
                    <h2 className="text-primary-100">PrepGuru</h2>
                </Link>

                <form action={signOutAndRedirect}>
                    <Button type="submit" variant="ghost" className="text-light-100">
                        Sign out
                    </Button>
                </form>
            </nav>

            {children}
        </div>
    );
};

export default Layout;