import Link from "next/link";

export default async function Home() {


  return (
    <main className="p-10">
      <h1>Hello Next.js</h1>
        <Link href="/portal" className="hover:text-blue-600 whitespace-nowrap">ダッシュボード</Link>
    </main>
  );
}