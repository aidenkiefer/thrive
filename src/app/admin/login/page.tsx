// Admin login page — outside NextAuth middleware protection
// Handles credential login; redirects to /admin on success

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-bold">Admin Login</h1>
        {/* TODO: Login form using next-auth signIn() */}
        {/* Fields: email, password */}
        {/* Error state for failed login */}
      </div>
    </div>
  )
}
