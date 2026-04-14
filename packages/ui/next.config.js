/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do NOT bundle these on the server — they load native WASM from disk.
  // webpack resolves them from the real node_modules, keeping __dirname correct.
  serverExternalPackages: [
    "@aztec/aztec.js",
    "@aztec/accounts",
    "@aztec/bb.js",
    "@aztec/stdlib",
    "@aztec/foundation",
    "@aztec/entrypoints",
    "@aztec/wallets",
    "@aztec/wallet-sdk",
    "@aztec/pxe",
    "@aztec/kv-store",
    "@aztec/simulator",
    "@aztec/bb-prover",
    "@aztec/protocol-contracts",
    "lmdb",
  ],

  webpack(config, { isServer }) {
    if (isServer) {
      // Polyfill Node.js built-ins that some @aztec/* deps reference via
      // webpack's browser-field resolution.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
        stream: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
