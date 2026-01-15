export default function Login() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">

      {/* LEFT */}
      <div className="hidden md:flex flex-col justify-center px-16 
        bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-600 text-white relative">

        {/*subtle shapes */}
        <div className="absolute top-10 left-10 w-24 h-24 bg-white/5 rounded-full"></div>
        <div className="absolute bottom-20 right-16 w-32 h-32 bg-white/5 rounded-full"></div>

        <h1 className="text-3xl md:text-4xl font-bold leading-snug mb-4 text-white/90">
          ReachInbox
        </h1>

        <p className="text-sm md:text-md text-white/80 max-w-sm">
          AI-powered platform to schedule, manage, and track email campaigns effortlessly.
        </p>

        <div className="mt-8 flex gap-3">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 w-20 text-center">
            <p className="text-lg font-semibold text-white">10k+</p>
            <p className="text-xs text-white/70">Emails/day</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 w-20 text-center">
            <p className="text-lg font-semibold text-white">99.9%</p>
            <p className="text-xs text-white/70">Delivery</p>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-center bg-slate-100">
        <div className="bg-white rounded-3xl shadow-lg p-10 w-[360px]">

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome back
          </h2>

          <p className="text-slate-500 mb-6 text-sm">
            Sign in to continue to ReachInbox
          </p>

          <a href="http://localhost:4001/auth/google">
            <button
              className="
                w-full flex items-center justify-center gap-3
                border border-slate-200 py-3 rounded-xl
                font-semibold text-slate-700
                hover:bg-slate-50 hover:shadow-md
                transition
              "
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5"
              />
              Continue with Google
            </button>
          </a>

          <p className="text-xs text-slate-400 mt-6 text-center">
            Secure sign-in · No credit card required
          </p>
        </div>
      </div>
    </div>
  );
}
