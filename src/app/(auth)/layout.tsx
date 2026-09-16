export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-gradient-bg relative flex min-h-dvh flex-col items-center justify-center px-4 py-8 sm:py-10">
      <div className="page-enter relative w-full max-w-sm">{children}</div>
    </div>
  );
}
