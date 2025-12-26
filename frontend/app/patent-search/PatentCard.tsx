import React from 'react';
import { ChevronDown, ExternalLink, AlertTriangle, CheckCircle, Info } from 'lucide-react';

// 型定義（例）
type Relevance = '◎' | '○' | '△';
interface PatentProps {
  patentNumber: string;
  title: string;
  summary: string;
  relevance: Relevance;
  techDistance: string;
  practicalValue: string;
  risk: string;
  reason: string;
}

const RelevanceBadge = ({ level }: { level: Relevance }) => {
  const styles = {
    '◎': 'bg-rose-100 text-rose-700 border-rose-200',
    '○': 'bg-blue-100 text-blue-700 border-blue-200',
    '△': 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-bold border ${styles[level]}`}>
      総合評価: {level}
    </span>
  );
};

export const PatentCard: React.FC<PatentProps> = ({
  patentNumber,
  title,
  summary,
  relevance,
  techDistance,
  practicalValue,
  risk,
  reason,
}) => {
  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 hover:shadow-md transition-shadow duration-200">
      {/* Header Section */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <a 
              href={`https://patents.google.com/?q=${patentNumber}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-sm font-mono text-blue-600 hover:underline flex items-center gap-1"
            >
              {patentNumber} <ExternalLink size={12} />
            </a>
            <RelevanceBadge level={relevance} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 leading-tight">{title}</h3>
        </div>
      </div>

      {/* Evaluation Grid Section */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50 border-b border-slate-100">
        <div className="p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">技術的距離</p>
          <p className="font-semibold text-slate-700">{techDistance}</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">実用的価値</p>
          <p className="font-semibold text-slate-700">{practicalValue}</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">権利リスク</p>
          <div className="flex items-center justify-center gap-1">
            {risk === '高' && <AlertTriangle size={14} className="text-amber-500" />}
            <p className={`font-semibold ${risk === '高' ? 'text-amber-600' : 'text-slate-700'}`}>
              {risk}
            </p>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-4">
        {/* Summary */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">概要</h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            {summary}
          </p>
        </div>

        {/* Reason / Analysis Box */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
          <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Info size={14} /> 関連性評価の理由
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed">
            {reason}
          </p>
        </div>
      </div>
    </div>
  );
};