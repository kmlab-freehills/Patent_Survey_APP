// Patent_Survey_APP/frontend/app/home/layout.tsx

import MainLayout from "../MainLayout";

export default function Layout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <MainLayout>{children}</MainLayout>
        </>
    );
}
