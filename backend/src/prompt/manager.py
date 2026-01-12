# Patent_Survey_APP/backend/src/prompt/manager.py

from typing import Dict, Optional
from src.prompt.templates.task.analysis_prompt import build_analysis_prompt
from src.prompt.templates.task.idea_prompt import build_idea_prompt
from src.prompt.templates.system.patent_system_prompt import SYSTEM_PROMPT_PATENT, build_patent_chat_system_prompt

# ============================================================
# 【プロンプト管理】
# context --> {"資料の種類": "該当資料のテキスト"}
# ============================================================

class PromptManager:
    """
    PromptManagerの責務:
    - contextのバリデーション
    - prompt文字列への変換
    - レポート構造・DBには一切触れない
    """
    @staticmethod
    def build_prompt(prompt_type: str, context: Dict[str, str]) -> str:
        """タスクプロンプト構築"""
        
        # ============================================================
        # 特許解析～アイデア生成～チャット
        # ============================================================
        
        # 1. 特許解析用
        if prompt_type == "analysis":
            # 辞書から取得
            patent_text = context.get("patent_text", "")
            # 必須チェック
            if not patent_text:
                raise ValueError("特許解析には 'patent_text' が必要です")
            # プロンプト構築
            prompt = build_analysis_prompt(patent_text)
            return prompt

        # 2. アイデア生成用
        elif prompt_type == "idea":
            # 辞書から取得
            patent_text = context.get("patent_text", "")
            analysis_text = context.get("analysis_text", "")
            # 必須チェック
            if not patent_text:
                raise ValueError("アイデア生成には 'patent_text' が必要です")
            if not analysis_text:
                raise ValueError("アイデア生成には 'analysis_text' が必要です")
            # プロンプト構築
            prompt = build_idea_prompt(patent_text, analysis_text)
            return prompt

        # （将来的に、機能追加に合わせて増やしていく）

        else:
            raise ValueError(f"未定義のプロンプトタイプ: {prompt_type}")
    
    @staticmethod
    def build_system_prompt(system_prompt_type: str, context: Dict[str, str]) -> Optional[str]:
        """システムプロンプト構築"""
        # 指定しない場合のハンドリング
        if not system_prompt_type:
            return None

        # ============================================================
        # 特許解析～アイデア生成～チャット
        # ============================================================

        # 1. 特許解析＆アイデア生成用（返り値の記述は明示的に揃える）
        if system_prompt_type == "patent":
            system_prompt = SYSTEM_PROMPT_PATENT
            return system_prompt

        # 2. チャット用
        elif  system_prompt_type == "patent_chat":
            # 辞書から取得
            patent_text = context.get("patent_text", "")
            analysis_text = context.get("analysis_text", "")
            idea_text = context.get("idea_text")
            if not patent_text:
                raise ValueError("チャットには 'patent_text' が必要です")
            if not analysis_text:
                raise ValueError("チャットには 'analysis_text' が必要です")
            if not idea_text:
                raise ValueError("チャットには 'idea_text' が必要です")
            # プロンプト構築
            system_prompt = build_patent_chat_system_prompt(patent_text, analysis_text, idea_text)
            return system_prompt
        
        else:
            raise ValueError(f"未定義のシステムプロンプトタイプ: {system_prompt_type}")
        
        # （将来的に、機能追加に合わせて増やしていく）