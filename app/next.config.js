/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // CloudLinux/LVE shared hosting restricts forking new OS processes, which
  // crashes Next's build-time worker pool (SIGABRT) unless it uses worker
  // threads instead of child processes.
  experimental: {
    cpus: 1,
    workerThreads: true,
  },
};

module.exports = nextConfig;
