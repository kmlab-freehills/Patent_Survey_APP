// Patent_Survey_APP/frontend/app/home/idea/components/FigureList.tsx

import type { components } from "@/types/schema";
import { Divide } from "lucide-react";
type PatentImage = components["schemas"]["PatentImage"];

type FigureListProps = {
    images: PatentImage[];
    onSelect: (img: PatentImage) => void;
};

// 画像GET用
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export const FigureList = ({ images, onSelect }: FigureListProps) => {
    if (images.length === 0) return null;

    return (
        // 図が多くなると本文を圧迫するため、画像2枚分の高さと幅をもたせる
        <div className="h-80 p-2 overflow-y-scroll border-t">
            <div className="flex gap-2">
                <h3 className="text-sm font-semibold text-slate-600 mb-2">
                    図一覧
                </h3>
                <span className="text-xs pt-1 text-slate-600">クリックして拡大</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {images.map((img) => (
                    <button
                        key={img.id}
                        onClick={() => onSelect(img)}
                        className="group rounded-lg border bg-white shadow-sm hover:shadow-md transition">
                        <img
                            src={`${API_BASE}${img.url}`}
                            alt={img.label}
                            loading="lazy"
                            className="w-full h-24 object-contain bg-slate-50"
                        />
                        <div className="text-xs text-center py-1 text-slate-600">
                            {img.label}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
