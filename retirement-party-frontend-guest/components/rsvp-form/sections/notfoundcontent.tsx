import Link from "next/link";

interface NotFoundContentProps {
  heading?: string;
  description?: string;
}

export function NotFoundContent({
  heading = "Page not found",
  description = "The page you're looking for doesn't exist or may have been moved.",
}: NotFoundContentProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f8f7f4] px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#9a7b32]">
        404
      </p>

      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#292929] sm:text-4xl">
        {heading}
      </h1>

      <p className="mt-3 max-w-md text-base leading-7 text-[#6b6b6b]">
        {description}
      </p>

      <Link
        href="/"
        className="mt-8 text-sm font-medium text-[#292929] underline underline-offset-4"
      >
        Back to Invitation
      </Link>
    </main>
  );
}