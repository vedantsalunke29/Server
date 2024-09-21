module.exports = {
    apps: [
      {
        name: 'BackendAPI',
        script: 'backend/index.js',
        env: {
          MONGO_URI: process.env.MONGO_URI,
          APP_PASS: process.env.APP_PASS,
          CLOUDINARY_URL: process.env.CLOUDINARY_URL,
          CLOUD_API_KEY: process.env.CLOUD_API_KEY,
          CLOUD_API_SECRET: process.env.CLOUD_API_SECRET,
          CLOUD_NAME: process.env.CLOUD_NAME,
          JWT_SECRET: process.env.JWT_SECRET,
          NODE_ENV: process.env.NODE_ENV || 'development',
          PORT: process.env.PORT || 5000,
          PORT_PY: process.env.PORT_PY,
          USER_EMAIL: process.env.USER_EMAIL,
        },
        env_production: {
          NODE_ENV: 'production',
        },
      },
    ],
  };
  