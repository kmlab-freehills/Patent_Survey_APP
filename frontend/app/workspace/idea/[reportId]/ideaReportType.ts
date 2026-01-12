// frontend/app/workspace/idea/[reportId]/ideaReportType.ts

/**
 * アイデア生成レポート (Idea Report) の content フィールドの型定義
 *
 * 方針:
 * - バックエンドの実装に合わせて柔軟に拡張・修正を行う。
 * - 現状は特許アップロード情報 (patent_info) のみが確定しているため、それを定義する。
 * - 未実装のフィールドについては、必要になった段階で追記する。
 */

export interface IdeaReportContent {
    // Step 1: 特許登録情報
    // バックエンド: backend/src/services/patent/patent_api.py で保存される構造
    patent_info?: {
        filename: string; // アップロードされたファイル名
        patent_id: string; // 特許ID（現状はレポートIDと同一）
        has_patent: boolean; // 特許データを持っているかどうかのフラグ
        image_count: number; // 抽出された画像の枚数
    };
}
