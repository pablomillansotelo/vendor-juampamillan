import app from './api/index.js';
import { runMigrations } from './src/migrations.js';

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

// En desarrollo/local: aplicar migraciones al arrancar el proceso (ORM/Drizzle).
await runMigrations();

app.listen(Number(PORT), () => {
  console.log(`🚀 Vendor Backend API corriendo en http://localhost:${PORT}`);
  console.log(`📚 Documentación Swagger en http://localhost:${PORT}/swagger`);
});

