"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  // /generate/content を呼び出してストリーミング受信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOutput("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/generate/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: input,
          tool_mode: "search", // ここを "text" / "search" / "search_url" に変えることも可能
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("LLMからのストリームを取得できませんでした");
      }

      // ストリーム読み取り
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setOutput(prev => prev + chunk); // 逐次チャンクを表示
      }
    } catch (err) {
      console.error(err);
      setOutput("エラーが発生しました。")
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Gemini ストリーミング生成デモ</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          style={{ width: "100%", fontSize: "1rem", padding: "0.5rem" }}
          placeholder="プロンプトを入力..."
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: "0.5rem",
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          {loading ? "生成中..." : "送信"}
        </button>
      </form>

      <div
        style={{
          border: "1px solid #ccc",
          minHeight: "200px",
          padding: "1rem",
          whiteSpace: "pre-wrap",
          backgroundColor: "#fafafa",
        }}
      >
        {output || (loading ? "応答を待っています..." : "ここに出力が表示されます")}
      </div>
    </main>
  );
}
