// ─── Typed Configuration Factory ─────────────────────────────────────────────
// All environment variables are read here and typed.
// Access via ConfigService<ReturnType<typeof configuration>>.

export const configuration = () => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: parseInt(process.env['PORT'] ?? '3000', 10),

  database: {
    host: process.env['DB_HOST'] ?? 'localhost',
    port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
    name: process.env['DB_NAME'] ?? 'oscar_vyent',
    user: process.env['DB_USER'] ?? 'postgres',
    pass: process.env['DB_PASS'] ?? '',
  },

  mollie: {
    apiKey: process.env['MOLLIE_API_KEY'] ?? '',
    webhookSecret: process.env['MOLLIE_WEBHOOK_SECRET'] ?? '',
  },

  app: {
    baseUrl: process.env['APP_BASE_URL'] ?? 'http://localhost:3000',
    frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:4200',
    allowedOrigins: (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:4200')
      .split(',')
      .map((o) => o.trim()),
  },
});

export type AppConfig = ReturnType<typeof configuration>;
