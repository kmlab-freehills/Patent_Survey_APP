// Patent_Survey_APP/frontend/app/home/idea/components/sidebar/PatentImageModal.tsx

import type { components } from "@/types/schema";
type PatentImage = components["schemas"]["PatentImage"];

// ============================================================
// 原文参照サイドバー内で画像をクリックすると起動するモーダル
// ============================================================

type PatentImageModalProps = {
    image: PatentImage | null;
    onClose: () => void;
};

// 画像GET用URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export const PatentImageModal = ({ image, onClose }: PatentImageModalProps) => {
    if (!image) return null;

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
            onClick={onClose}>
            <div
                className="bg-white rounded-xl p-4 max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2">
                    <h2 className="font-semibold">{image.label}</h2>
                    <button onClick={onClose}>✕</button>
                </div>

                <img
                    src={`${API_BASE}${image.url}`}
                    alt={image.label}
                    className="w-full max-h-[80vh] object-contain"
                />
            </div>
        </div>
    );
};
