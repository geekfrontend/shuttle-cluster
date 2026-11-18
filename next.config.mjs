/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  compiler: {
    // Log error/warn API tetap dipertahankan di production (Vercel logs).
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: false,
      },
      {
        source: "/dashboard/default",
        destination: "/",
        permanent: false,
      },
      {
        source: "/dashboard/:path*",
        destination: "/:path*",
        permanent: false,
      },
      // Layar contoh Tasks disembunyikan dari menu; kodenya tetap ada sebagai referensi pola halaman dengan tabel.
      {
        source: "/tasks",
        destination: "/",
        permanent: false,
      },
      // Halaman auth lama (/auth/login, /auth/register, /auth/change-password, /auth/v1/...) → satu-satunya halaman auth.
      {
        source: "/auth/:path*",
        destination: "/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
