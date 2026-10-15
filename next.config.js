/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Applies to every route.
        source: "/:path*",
        headers: [
          // Prevents the site from being embedded in an <iframe> on another
          // domain — the main defense against clickjacking.
          { key: "X-Frame-Options", value: "DENY" },
          // Stops browsers from guessing ("sniffing") a file's content type,
          // which can otherwise be abused to execute disguised scripts.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Forces HTTPS for a year, including subdomains, once a browser
          // has seen this header once — protects against downgrade attacks.
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Limits how much referrer information is sent to other sites.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
