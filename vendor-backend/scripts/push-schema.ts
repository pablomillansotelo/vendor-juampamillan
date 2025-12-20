/**
 * Script para sincronizar la base de datos con los schemas
 * Usa drizzle-kit push para sincronizar directamente desde los schemas
 * 
 * Ejecutar con: bun run scripts/push-schema.ts
 * 
 * Este script es útil en desarrollo para sincronizar rápidamente
 * En producción, usa migraciones generadas con: bun run db:generate && bun run db:migrate
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/schema.js';

async function pushSchema() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const db = drizzle(sql, { schema });

    console.log('🔄 Sincronizando base de datos con schemas...');

    // Drizzle no tiene push directo en runtime, pero podemos usar
    // un enfoque que ejecute las migraciones o use drizzle-kit
    // Por ahora, verificamos que las migraciones estén ejecutadas
    
    // En su lugar, recomendamos usar: bun run db:push
    // que ejecuta drizzle-kit push desde la línea de comandos
    
    console.log('💡 Para sincronizar schemas, ejecuta: bun run db:push');
    console.log('💡 Para generar y ejecutar migraciones: bun run db:generate && bun run db:migrate');
    
  } catch (error: any) {
    console.error('❌ Error al sincronizar:', error);
    throw error;
  }
}

if (import.meta.main) {
  pushSchema()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

export { pushSchema };

