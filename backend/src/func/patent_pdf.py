import re
import io
from pypdf import PdfReader
from dataclasses import dataclass, field
from typing import Dict, List, Optional

"""
# J-PlatPat特許広報PDF テキスト整形コード

目的: LLMによる分析で与える際のテキスト処理
原則: わずかなトークンコストで得られる明確性は、常に優先すべき
理由: 特許文書という高精度が求められるドメインであるため
補足: 前処理…J-PlatPatからダウンロードした特許PDFについて、pypdfでテキストを抽出→そのテキストに対する処理/作成中
"""

# ==========================================
# PDFファイル読み込み処理
# ==========================================
def read_pdf(pdf_bytes):

    reader = PdfReader(io.BytesIO(pdf_bytes))
    full_text = ""
    for page_num in range(len(reader.pages)):
        page = reader.pages[page_num]
        full_text += page.extract_text()

    return full_text

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# [1] 初期整形
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def patent_text_cleanup(text):
    """PDFから抽出されたテキストを整形・置換するラッパー関数"""

# ==========================================
# 整形メイン関数
# ==========================================
    def clean_text(text):
        """特許テキスト整形関数"""

        ## Step.1 PDF特有のレイアウトを除去 ##
        text = re.sub(r'—{10,}.*', '', text, flags=re.DOTALL)              # 区切り線（—が10個以上）以降を削除（フロントページの続き...は不要）
        text = re.sub(r'^\d+\n', '', text, flags=re.MULTILINE)             # 行番号除去① 例)10\n20\n30\n40\n50
        text = re.sub(r'^\d+(\(\d+\))', r'\1', text, flags=re.MULTILINE)   # 行番号除去② 例:50(30)→(30)
        text = re.sub(r'JP .*?\d{4}\.\d{1,2}\.\d{1,2}\s*\n', '', text)     # 文書情報を除去
        text = re.sub(r'\(\d+\)', "", text)                                # (50)のような表記を除去
        text = re.sub(r'[ \t]*\n[ \t]*', "", text)                         # 全ての改行と周辺の空白を一旦削除（PDFの幅に合わせて改行されているため）

        ## Step.2 【見出し】の構造化 ##
        # 先に見出しの前後に改行を入れておくことで、後続の正規表現（範囲指定）を安全にする
        text = re.sub(r'【', '\n【', text) # 【見出し】の前に改行を挿入
        text = re.sub(r'】', '】\n', text) # 【見出し】の後に改行を挿入

        ## Step.3 【要約】に対する処理 ##
        text = re.sub(r'【課題】', r'[課題]\n', text)
        text = re.sub(r'【解決手段】', r'[解決手段]\n', text)
        text = re.sub(r'【選択図】', r'[選択図]\n', text)

        ## Step.4 【符号の説明】に対する処理 ##
        text = format_symbol_section_safe(text) # 当該セクション内のみに限定して置換を行う

        ## Step. 5 【図面の簡単な説明】に対する処理 ##
        text = format_draw_section(text)

        ## Step.6 【段落番号】に対する処理 ##
        text = re.sub(r'【(\d{4})】', r'\n[段落: \1]\n', text)                  # 【数字4桁】を [段落:数字] + 改行に変換
        text = re.sub(r'(【符号の説明】)\s*\[段落: \d+\]\n', r'\1\n', text)     # 【符号の説明】の段落番号は除去
        text = re.sub(r'(【図面の簡単な説明】)\s*\[段落: \d+\]\n', r'\1', text) # 【図面の簡単な説明】の段落番号は除去
        text = re.sub(r'(【特許文献】)\s*\[段落: \d+\]\n', r'\1', text)         # 【特許文献】の段落番号は除去
        text = re.sub(r'【特許文献(\d)】', r'[特許文献: \1]\n', text)           #【特許文献X】を段落番号のフォーマットと合わせる
        text = re.sub(r'【請求項(\d+)】', r'[請求項: \1]\n', text)              # 【請求項X】を段落番号のフォーマットと合わせる

        ## Step.7 最終レイアウト調整 ##
        text = re.sub(r'　', '', text)          # すべての全角空白を削除
        text = re.sub(r'\n{2,}', "\n", text )   # 連続する改行を1つにまとめる
        text = re.sub(r'。', '。\n', text)      # 「。」の後に改行を挿入して可読性を向上
        text = re.sub(r'【', '\n【', text)      # 【見出し】の前に改行を挿入（段落番号の処理で行が詰まった見出しへの対応）
        text = re.sub(r'\n\n\n', r'\n\n', text) # 2連続の空白行を1つに

        return text.strip()

    def replacement_cleanup(text):
        """特許テキスト置換関数"""

        ## Step.1 置換準備 ##
        def full_number_to_half(match):
            """全角数字を半角数字に変換する関数"""
            char = match.group(0)                                         # マッチした全角数字を1文字取得
            return chr(ord(char) - ord('０') + ord('0'))                  # Unicodeの差を利用して半角に変換

        def full_alphabet_to_half(match):
            """全角英字を半角に変換する関数"""
            char = match.group(0)
            return chr(ord(char) - ord('Ａ') + ord('A'))

        # 全角記号から半角記号への置換マップ {'全角': '半角'}
        replace_map = {
            '（': '(', '）': ')', '「': '"', '」': '"', '『': '"', '』': '"',
            '《': '"', '》': '"', '〈': '"', '〉': '"', '〔': '[', '〕': ']',
            '［': '[', '］': ']', '｛': '{', '｝': '}', '‘': '`', '’': '`',
            '“': '"', '”': '"', '′': '`', '．': '.', '／': '/', '：': ':',
            '；': ';', '＜': '<', '＞': '>', '％': '%',
            }

        ## Step.2 置換実行 ##
        # 全角英数を半角に変換（全角英数 ０〜９・Ａ～Ｚ・ａ～ｚ → 半角英数 0〜9・A～Z・a～z）
        text = re.sub( r'[０-９]', full_number_to_half, text )
        text = re.sub( r'[Ａ-Ｚ]', full_alphabet_to_half, text )
        text = re.sub( r'[ａ-ｚ]', full_alphabet_to_half, text )

        # 全角記号や句読点をまとめて置換（replace_map参照）
        for full, half in replace_map.items():
            text = text.replace(full, half)

        return text.strip()


# ==========================================
# 補助関数
# ==========================================

    def format_draw_section(text):
        """【図面の簡単な説明】を整形/【図面の簡単な説明】内の【図◯】とそれ以外の【図◯】を区別/clean_text()内で使用"""

        def replace_figures(match):
            header = match.group(1)  # 【図面の簡単な説明】
            content = match.group(2) # セクションの中身

            content = re.sub(r'【図(.+?)】', r'[図: \1]\n', content) # 【図X】を[図: X]に置換
            content = re.sub(r' \[図(.+?)\]', r'[図\1]', content) # [図X]前に存在する半角スペースを除去
            return header + content

        # 表記ゆれ対応
        header_regex = r'(【(?:図面の簡単な説明|図面の説明|図面の概略説明)】)'
        # 上記見出しから、次の「主要なセクション開始」または文末($) までを対象にする(肯定先読み)
        pattern = header_regex + r'(.*?)(?=(?:【(?!(?:図|[0-9０-９])).+?】|$))'

        # re.DOTALL: . が改行にもマッチするようにする（改行が含まれていても対応可能に）
        return re.sub(pattern, replace_figures, text, flags=re.DOTALL)

    def format_symbol_section_safe(text):
        """【符号の説明】セクションのみを抽出して整形処理を行う"""

        def process_content(match):
            content = match.group(0)

            content = re.sub(r'(\d+)　', r'\1： ', content)               # 全角数字+全角空白→全角数字+：に置換
            content = re.sub(r'、(\d+)', r'\n\1', content)                # 「、」+全角数字→改行＋全角数字に置換（※ここでだけ実行）
            content = re.sub(r'([\dＡ-Ｚａ-ｚ]+)　', r'  \1： ', content) # 英数の場合はインデント(階層構造)を付与
            content = re.sub(r'([\dＡ-Ｚａ-ｚ]+：)', r'- \1', content)    # 箇条書きリスト付与
            return content

        # 【符号の説明】の見出し後から、次の【見出し】が来るまでをターゲットにする（前処理で見出しの前後に改行(\n)を入れているため、それを区切りとして利用）
        pattern = r'(?<=【符号の説明】\n)(.*?)(?=\n【|$)'

        return re.sub(pattern, process_content, text, flags=re.DOTALL)


# ==========================================
# 実行部分
# ==========================================

    cleaned_text = clean_text(text)
    cleaned_text = replacement_cleanup(cleaned_text)

    return cleaned_text


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# [2] クラスオブジェクト化
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ==========================================
# 1. 設定・マッピング定義（クラスより先に定義）
# ==========================================

SECTION_MAPPING = {
    'abstract': ['要約'],
    'claims': ['特許請求の範囲', '請求の範囲'],
    'tech_field': ['技術分野'],
    'background': ['背景技術', '従来の技術'],
    'problem_to_solve': ['発明が解決しようとする課題'],
    'means_to_solve': ['課題を解決するための手段'],
    'effect': ['発明の効果'],
    'drawings_desc': ['図面の簡単な説明', '図面の説明'],
    'embodiments': ['発明を実施するための形態', '発明を実施するための最良の形態', '実施例'],
    'symbols_desc': ['符号の説明'],
    'industrial_applicability': ['産業上の利用可能性']
}

# 完全に無視する見出し
IGNORE_HEADERS = {
    '特許文献',
    '先行技術文献',
    '非特許文献'
}

# パース用逆引きマップ（【見出し】 -> 属性）
HEADER_TO_ATTR = {}
for attr, headers in SECTION_MAPPING.items():
    for h in headers:
        HEADER_TO_ATTR[h] = attr

# 表示・判定用逆引きマップ（属性名 -> 【代表見出し】）
ATTR_TO_HEADER = {attr: headers[0] for attr, headers in SECTION_MAPPING.items()}


# ==========================================
# 2. データ構造の定義
# ==========================================

@dataclass
class PatentDocument:
    """特許文書の構造化データクラス"""
    # 主要セクション
    abstract: str = ""                  # 要約
    claims: str = ""                    # 特許請求の範囲
    tech_field: str = ""                # 技術分野
    background: str = ""                # 背景技術
    problem_to_solve: str = ""          # 発明が解決しようとする課題
    means_to_solve: str = ""            # 課題を解決するための手段
    effect: str = ""                    # 発明の効果
    drawings_desc: str = ""             # 図面の簡単な説明
    embodiments: str = ""               # 発明を実施するための形態
    symbols_desc: str = ""              # 符号の説明
    industrial_applicability: str = ""  # 産業上の利用可能性

    # その他（未知のセクション）
    others: Dict[str, str] = field(default_factory=dict)

    def to_dict(self):
        return {k: v for k, v in self.__dict__.items() if v}

    def get_text(self, target_sections: Optional[List[str]] = None) -> str:
            """
            指定されたセクションを結合してテキストとして返します。

            Args:
                target_sections (list, optional): 取得したいセクション名のリスト。
                    Noneの場合は「中身が存在する全てのセクション」を結合します。
                    例: ['abstract', 'claims']
                    セクション一覧:
                    'claims'
                    'tech_field'
                    'background'
                    'problem_to_solve'
                    'means_to_solve'
                    'effect'
                    'drawings_desc'
                    'embodiments'
                    'symbols_desc'
                    'industrial_applicability'

            Returns:
                str: 整形済みの結合テキスト
            """
            parts = []

            # 1. 取得対象の決定
            if target_sections is None:
                # 全属性を対象にする（othersは後で個別に処理）
                targets = list(ATTR_TO_HEADER.keys())
                include_others = True
            else:
                targets = target_sections
                include_others = False # 明示指定の場合はリストに含まれていれば処理する

            # 2. 標準セクションの結合
            for attr in targets:
                # othersに含まれるキーが指定された場合の処理（例: '図1'など）
                if attr in self.others:
                    header = f"【{attr}】"
                    content = self.others[attr]
                    parts.append(f"{header}\n{content}")
                    continue

                # クラス属性として存在する場合
                if hasattr(self, attr):
                    content = getattr(self, attr)
                    if content: # 中身がある場合のみ追加
                        # 属性名から日本語見出しに変換（見つからなければ属性名をそのまま使う）
                        header_text = ATTR_TO_HEADER.get(attr, attr)
                        header = f"【{header_text}】"
                        parts.append(f"{header}\n{content}")
                else:
                    # 属性もothersにもない場合（Typoなど）は無視またはWarn
                    pass

            # 3. others（その他）の全結合（target_sectionsがNoneの場合のみ）
            if include_others and self.others:
                for header_key, content in self.others.items():
                    header = f"【{header_key}】"
                    parts.append(f"{header}\n{content}")

            return "\n\n".join(parts)

    def get_missing_sections(self) -> List[str]:
        """
        データクラスに定義されているが、解析結果に含まれなかった（空の）セクション名のリストを返す。

        Returns:
            List[str]: 欠損しているセクションの日本語見出しリスト
            例: ['産業上の利用可能性', '発明の効果']
        """
        missing = []
        # 自身の属性を走査
        for attr, value in self.__dict__.items():
            # 'others' は動的辞書なので欠損チェックの対象外
            if attr == 'others':
                continue

            # 値が空文字の場合、欠損とみなす
            if not value:
                # 属性名を日本語の見出しに変換してリストに追加
                # マップにない場合（まずありえないが）は属性名をそのまま使う
                header_name = ATTR_TO_HEADER.get(attr, attr)
                missing.append(header_name)

        return missing
# ==========================================
# 3. パース処理関数
# ==========================================

def parse_patent_text(text: str) -> PatentDocument:
    """整形済みテキストを解析してPatentDocumentオブジェクトを返す"""

    doc = PatentDocument()

    # 「改行」または「文頭」の直後にある【見出し】で分割する
    parts = re.split(r'((?:^|\n)【.*?】)', text)

    # parts[0] は最初の見出しより前のテキスト（ゴミ or 書誌情報）のため無視
    # parts[1]が見出し, parts[2]が中身... の順で処理
    for i in range(1, len(parts), 2):
        if i + 1 >= len(parts):
            break

        header_raw = parts[i].strip()   # 【見出し】
        content = parts[i+1].strip()    # 本文

        # 見出しから余計な文字（【】や改行）を除去してキー化
        header_key = re.sub(r'[【】\n]', '', header_raw)

        # 中身が空の場合はスキップ（例: 【発明の詳細な説明】の直後に【技術分野】が来る場合など）
        if not content:
            continue

        # 除外リストに含まれるかチェック（保存せずにスキップ）
        if header_key in IGNORE_HEADERS:
            continue

        # マッピング処理
        if header_key in HEADER_TO_ATTR:
            attr_name = HEADER_TO_ATTR[header_key]
            current_val = getattr(doc, attr_name)
            # 同じセクションが分散している場合は結合
            new_val = (current_val + "\n\n" + content).strip() if current_val else content
            setattr(doc, attr_name, new_val)
        else:
            doc.others[header_key] = content

    return doc

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# [3] メイン処理
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def patent_text_extraction(pdf_bytes):
    """特許PDFのテキストを抽出・整形しPatentDocumentに変換する関数"""
    pdf_text = read_pdf(pdf_bytes)                         # PDFのテキスト抽出
    cleaned_text = patent_text_cleanup(pdf_text)          # 抽出されたテキストの整形・置換
    patent_doc = parse_patent_text(cleaned_text)          # PatentDocumentオブジェクトに変換
    missing_sections = patent_doc.get_missing_sections()  # 存在しないセクションの抽出
    if missing_sections:
        print("以下のセクションはこの文書に含まれていませんでした:")
        for section in missing_sections:
            print(f"- {section}")
    else:
        print("定義されたすべてのセクションが存在します。")
    return patent_doc

# 利用例
# patent_doc = patent_text_extraction(pdf_bytes)
# print(patent_doc.get_text(['abstract']))