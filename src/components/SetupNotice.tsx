import Link from "next/link";

export function SetupNotice() {
  return (
    <div className="rounded-md border border-saffron/40 bg-white p-4 shadow-soft">
      <p className="font-semibold text-ink">Supabase is not connected yet.</p>
      <p className="mt-1 text-sm text-ink/70">
        Add your project URL and anon key to <code>.env.local</code>, then restart the dev server.
      </p>
      <Link className="mt-3 inline-flex rounded-md bg-saffron px-3 py-2 text-sm font-semibold text-ink" href="/auth">
        Set up sign in
      </Link>
    </div>
  );
}
