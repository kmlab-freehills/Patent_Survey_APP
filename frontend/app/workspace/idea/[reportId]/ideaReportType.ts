// frontend/app/workspace/idea/[reportId]/ideaReportType.ts

// ============================================================
// 【アイデア生成レポート (Idea Report) の content フィールドの型定義】
// レポート共通原則:
// - 大きな機能ごとに異なる柔軟なフィールドを持つ（レポート指向）
// - metadata はバックエンドで定義して共通フィールドとして固め、content は各機能で設計
// 設計方針:
// - レポートは 1 JSON ドキュメントとして完結させる
// - DB 正規化や細粒度テーブルは行わない
// - 実装コストが発生するフィールドは最小限に留める
// - バックエンドの実装に合わせて柔軟に拡張・修正を行う
// - 将来の拡張余地は「構造」と「コメント」で確保し、必要になった段階で追記する
// ============================================================


export interface IdeaReportContent {
    // ============================================================
    // 【レポートの進行状況】
    //  UI の状態管理（どのステップにいるか）を目的とした最小構成。
    //  ステップ詳細や履歴管理が必要になった場合は、ここを拡張する。
    // ============================================================

    progress?: {
        // 現在のステップ（例: "upload" | "analysis" | "ideas" | "chat"）
        current_step: string;

        // レポート全体の状態（例: "draft" | "in_progress" | "completed" | "error"）
        status: string;
    };

    // ============================================================
    // 【Step 1: 特許登録情報】
    //  バックエンド: backend/src/services/patent/patent_api.py
    //  特許ファイルがアップロードされた時点で保存される。
    // ============================================================

    patent_info?: {
        filename: string; // アップロードされた特許ファイル名
        patent_id: string; // 特許ID（現状は report_id と同一）
        has_patent: boolean; // 特許データが存在するかどうか
        image_count: number; // 特許 PDF から抽出された画像枚数
    };

    // ============================================================
    // 【生成 AI によって作られたコンテンツ群】
    // 人間入力や外部データと明確に区別するために
    // generated 配下にまとめている。
    // ============================================================

    generated?: {
        // ------------------------------------------------------------
        // 【単発実行で生成された成果物群】
        // 各 artifact は再生成・差し替え可能な単位。（例: 特許解析・アイデア生成結果）
        // ------------------------------------------------------------

        artifacts?: {
            patent_summary?: GeneratedArtifact;
            idea_generation?: GeneratedArtifact;

            // 今後 artifact が増えた場合はここに追加する
            // [artifactName: string]: GeneratedArtifact;
        };

        // ------------------------------------------------------------
        // 【ユーザーと AI の対話ログ】
        // 状態を持つため artifacts とは分離している。
        // ------------------------------------------------------------

        conversation?: {
            // 実行タイプ（単発か対話かの明示的な区別）
            type: "multi_turn";

            // 対話用のシステムプロンプトの識別子（バックエンドで動的にプロンプトを構築する際に参照）
            system_prompt_type: string;

            // 対話時に参照している文脈情報（システムプロンプト末尾に挿入される）
            context: string[]; // （例: 特許原文 / 解析結果 / アイデア生成結果）

            // チャットメッセージの履歴
            messages: {
                role: "user" | "assistant";
                content: string;
            }[];

            // 会話生成時のメタデータ（サンプリングパラメータ等は必要になった段階で拡張）
            meta?: GeneratedMeta;
        };
    };
}

// ============================================================
// 【単発生成 artifact の共通構造】
// 「再実行可能な生成結果」を表す。
// ============================================================

export interface GeneratedArtifact {
    // 実行タイプ（単発か対話かの明示的な区別）
    type: "single_shot";

    // 使用するシステムプロンプトの識別子（バックエンドで動的にプロンプトを構築する際に参照）
    system_prompt_type: string;

    // 使用するプロンプトの識別子（バックエンドで動的にプロンプトを構築する際に参照）
    prompt_type?: string;

    // 入力として与えた情報
    input: string[];

    // 生成結果（現状はテキスト前提）
    output: string;

    // 生成メタデータ（実装コストが重いため、現段階では最小限に留める）
    meta?: GeneratedMeta;
}

// ============================================================
// 【生成 AI 実行時の最小メタ情報】
// 将来的にトークン数やサンプリングパラメータ等を
// 追加できる余地を残している。
// ============================================================

export interface GeneratedMeta {
    // 使用したモデル名
    model: string;

    // temperature（他のサンプリングパラメータは未定義）
    temperature: number;

    // 最終実行日時
    last_run_at: string;
}

// === 以下、サンプルJSON ===
// 
//     "metadata": {
//         "report_id": "0b4348df-cf8d-41f5-8cde-f4f949902127",
//         "title": "新規アイデア生成レポート",
//         "report_type": "idea",
//         "created_at": "2026-01-12T13:17:23.287704Z",
//         "updated_at": "2026-01-12T13:17:23.287704Z"
//     },
//     "content": {
//         "progress": {
//             "current_step": "chat",
//             "status": "completed"
//         },
//         "patent_info": {
//             "filename": "JPB 007501936-000000.pdf",
//             "patent_id": "0b4348df-cf8d-41f5-8cde-f4f949902127",
//             "has_patent": true,
//             "image_count": 2
//         },
//         "generated": {
//             "artifacts": {
//                 "patent_summary": {
//                     "type": "single_shot",
//                     "system_prompt_type": "SYSTEM_PROMPT_PATENT",
//                     "prompt_type": "analysis_prompt",
//                     "input": ["特許原文"],
//                     "output": "特許解析結果",
//                     "meta": {
//                         "model": "gemini-2.5-flash",
//                         "temperature": 0.6,
//                         "last_run_at": "2026-01-12T13:40:00Z"
//                     }
//                 },
//                 "idea_generation": {
//                     "type": "single_shot",
//                     "system_prompt_type": "SYSTEM_PROMPT_PATENT",
//                     "prompt_type": "idea_prompt",
//                     "input": ["特許原文", "特許解析結果"],
//                     "output": "アイデア生成結果",
//                     "meta": {
//                         "model": "gemini-2.5-flash",
//                         "temperature": 1.0,
//                         "last_run_at": "2026-01-12T13:40:00Z"
//                     }
//                 }
//             },
//             "conversation": {
//                 "type": "multi_turn",
//                 "system_prompt_type": "patent_chat_system_prompt",
//                 "context": ["特許原文", "特許解析結果", "アイデア生成結果"],
//                 "messages": [
//                     {
//                         "role": "user",
//                         "content": "このアイデアをさらに具体化して"
//                     },
//                     {
//                         "role": "assistant",
//                         "content": "はい、以下のように..."
//                     }
//                 ],
//                 "meta": {
//                     "model": "gemini-2.5-flash",
//                     "temperature": 0.7,
//                     "last_run_at": "2026-01-12T13:40:00Z"
//                 }
//             }
//         }
//     }
// }
