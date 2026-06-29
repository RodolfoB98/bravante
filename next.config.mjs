/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["docxtemplater", "pizzip", "docxtemplater-image-module-free"],
  outputFileTracingIncludes: {
    "/api/treinamentos/[id]/lista": ["./lib/templates/**"],
  },
};
export default nextConfig;
