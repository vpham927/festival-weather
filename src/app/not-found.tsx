import Link from "next/link";

export default function NotFound() {
  return (
    <main>
      <h1 className="festival-hero-name">Festival not found</h1>
      <p className="festival-hero-meta">
        That festival isn&apos;t in the list yet.
      </p>
      <Link href="/" className="back-link">
        ← All festivals
      </Link>
    </main>
  );
}
