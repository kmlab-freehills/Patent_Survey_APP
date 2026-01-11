from typing import Dict, Tuple, Optional
from src.prompt.templates.task.analysis_prompt import build_analysis_prompt
from src.prompt.templates.task.idea_prompt import build_idea_prompt
from src.prompt.templates.system.patent_system_prompt import SYSTEM_PROMPT_PATENT, build_patent_chat_system_prompt

class PromptManager:
    @staticmethod
    def build(prompt_type: str, context: Dict[str, str], user_input: str = "") -> Tuple[str, Optional[str]]:
        """
        戻り値: (user_prompt, system_instruction)
        """
        
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
            system_prompt = SYSTEM_PROMPT_PATENT
            prompt = build_analysis_prompt(patent_text)
            return prompt, system_prompt

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
            system_prompt = SYSTEM_PROMPT_PATENT
            prompt = build_idea_prompt(patent_text, analysis_text)
            return prompt, system_prompt

        # 3. チャット用（システムプロンプト構築）
        elif prompt_type == "chat":
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
            # ユーザーメッセージはそのまま返す
            return user_input, system_prompt

        else:
            raise ValueError(f"未定義のプロンプトタイプ: {prompt_type}")