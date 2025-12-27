import MainLayout from "../../components/MainLayout"; // パスは環境に合わせて調整してください

export default function Layout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <MainLayout>
                {children}
            </MainLayout>
        </>

    );
}