require('dotenv').config();

export default ({ config }) => {
  // Disable updates in development (Expo Go)
  const isDev = process.env.NODE_ENV !== 'production';
  
  const baseConfig = {
    ...config,
    owner: "awaisdevops",
    extra: {
      ...config.extra,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      REVENUECAT_API_KEY: process.env.REVENUECAT_API_KEY,
    },
  };

  // In development (Expo Go), disable remote updates
  if (isDev) {
    return {
      ...baseConfig,
      updates: {
        enabled: false,
      },
    };
  }

  // In production, keep updates enabled
  return baseConfig;
};