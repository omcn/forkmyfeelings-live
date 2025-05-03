// next.config.js
const withTM = require("next-transpile-modules")(["@supabase/supabase-js"]);

module.exports = withTM({
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'bufferutil': false,
        'utf-8-validate': false,
      };
    }
    return config;
  },
});
