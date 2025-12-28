import type { components } from '@/types/schema';
type PatentImage = components['schemas']['PatentImage']

type FigureReferenceProps = {
  figureNo: string;
  images: PatentImage[];
  onSelect: (img: PatentImage) => void;
};

export const FigureReference = ({
  figureNo,
  images,
  onSelect,
}: FigureReferenceProps) => {
  const target = images.find(
    (img) => img.label === `図${figureNo}`
  );

  if (!target) {
    return (
      <span className="text-slate-400">
        [図:{figureNo}]
      </span>
    );
  }

  return (
    <button
      onClick={() => onSelect(target)}
      className="inline text-blue-600 hover:underline"
    >
      [図:{figureNo}]
    </button>
  );
};
