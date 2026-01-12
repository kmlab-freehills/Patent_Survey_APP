// Patent_Survey_APP/frontend/app/workspace/layout.tsx

"use client";

import MainLayout from "@/app/workspace/MainLayout";
import { ReportProvider } from "@/hooks/useReport";
import React from "react";

export default function WorkspaceLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ReportProvider>
            <MainLayout>{children}</MainLayout>
        </ReportProvider>
    );
}
