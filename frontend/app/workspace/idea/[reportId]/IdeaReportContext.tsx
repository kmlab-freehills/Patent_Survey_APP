// /idea/[reportId]/IdeaReportContext.tsx
"use client";

import { createContext, useContext, useState } from "react";

type IdeaContextType = {
    activeParagraphId: string | null;
    setActiveParagraphId: (id: string | null) => void;
};

const IdeaContext = createContext<IdeaContextType | undefined>(undefined);

export const IdeaReportProvider = ({ children }: { children: React.ReactNode }) => {
    const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);

    return (
        <IdeaContext.Provider value={{ activeParagraphId, setActiveParagraphId }}>
            {children}
        </IdeaContext.Provider>
    );
};

export const useIdeaReport = () => {
    const ctx = useContext(IdeaContext);
    if (!ctx) throw new Error("useIdeaReport must be used within IdeaReportProvider");
    return ctx;
};