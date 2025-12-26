export default async function Home() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/health`,
    { cache: "no-store" } // 常に最新を取得
  );

  const data = await res.json();

  return (
    <main style={{ padding: 20 }}>
      <h1>Health Check</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}