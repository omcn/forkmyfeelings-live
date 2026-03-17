import Link from "next/link";

export const metadata = {
  title: "Page Not Found",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center px-6 text-center">
      <div className="text-8xl mb-4">🍴</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">404 — Page Not Found</h1>
      <p className="text-gray-600 mb-2 max-w-sm">
        Rascal looked everywhere but couldn't find this page.
      </p>
      <p className="text-gray-400 text-sm mb-8 max-w-sm">
        Maybe it was eaten? Try heading back to the kitchen.
      </p>
      <Link
        href="/"
        className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-8 rounded-full shadow-lg transition"
      >
        Back to Kitchen
      </Link>
    </div>
  );
}
