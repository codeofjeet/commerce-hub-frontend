
export default function StudentHeader() {
  return (
    <header className="flex min-h-[88px] items-center justify-between border-b border-slate-200 bg-white px-6 py-4 md:px-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Student Portal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome to Commerce Hub Kota Learning Platform
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">
            Student Account
          </p>
          <p className="text-xs text-slate-500">
            Commerce Hub Kota
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
          S
        </div>
      </div>
    </header>
  );
}
