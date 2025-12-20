import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as schema from './schema.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtener el directorio actual para paths absolutos
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Flag para asegurar que las migraciones solo se ejecuten una vez
let migrationsRun = false;
let migrationsPromise: Promise<void> | null = null;

/**
 * Ejecuta migraciones automáticas usando Drizzle Kit
 * Las migraciones se generan desde los schemas (única fuente de verdad)
 * 
 * Flujo:
 * 1. Intenta ejecutar migraciones generadas si existen
 * 2. Si no existen, muestra un mensaje indicando que se deben generar
 * 
 * En desarrollo: ejecuta `bun run db:push` para sincronizar directamente
 * En producción: ejecuta `bun run db:generate && bun run db:migrate` para migraciones versionadas
 */
export async function runMigrations(): Promise<void> {
  // Si ya se ejecutaron, retornar inmediatamente
  if (migrationsRun) {
    return;
  }

  // Si ya hay una ejecución en curso, esperar a que termine
  if (migrationsPromise) {
    return migrationsPromise;
  }

  // Ejecutar migraciones
  migrationsPromise = (async () => {
    try {
      const sql = neon(process.env.DATABASE_URL!);
      const db = drizzle(sql, { schema });

      // Usar path absoluto para las migraciones (necesario en Vercel)
      // Intentar diferentes ubicaciones posibles
      const possiblePaths = [
        join(__dirname, '../drizzle'), // Desde src/ hacia drizzle/
        join(process.cwd(), 'drizzle'), // Desde la raíz del proyecto
        './drizzle', // Path relativo (fallback)
      ];

      let migrationsExecuted = false;
      let lastError: Error | null = null;

      for (const migrationsFolder of possiblePaths) {
        try {
          console.log(`🔄 Intentando ejecutar migraciones desde: ${migrationsFolder}`);
          await migrate(db, { migrationsFolder });
          migrationsRun = true;
          migrationsExecuted = true;
          console.log('✅ Migraciones ejecutadas correctamente');
          return;
        } catch (error: any) {
          lastError = error;
          // Si el error es por archivo no encontrado, intentar siguiente path
          if (
            error.message?.includes('ENOENT') ||
            error.message?.includes('not found') ||
            error.message?.includes('No such file') ||
            error.message?.includes('_journal.json')
          ) {
            console.log(`ℹ️ No se encontraron migraciones en: ${migrationsFolder}`);
            continue; // Intentar siguiente path
          } else {
            // Otro tipo de error, lanzarlo
            throw error;
          }
        }
      }

      // Si llegamos aquí, no se encontraron migraciones en ningún path
      if (!migrationsExecuted) {
        console.log('ℹ️ No se encontraron migraciones generadas en ninguna ubicación.');
        console.log('💡 Paths intentados:', possiblePaths.join(', '));
        console.log('💡 Para sincronizar la BD con schemas, ejecuta:');
        console.log('   - Desarrollo: bun run db:push');
        console.log('   - Producción: bun run db:generate && bun run db:migrate');
        
        // En producción en Vercel, si no hay migraciones, usar el sistema de migraciones SQL directo
        // que ya está implementado en el código (no fallar)
        if (process.env.VERCEL) {
          console.log('⚠️ Ejecutando en Vercel sin migraciones Drizzle. Usando migraciones SQL directas.');
          migrationsRun = true;
          return;
        }
        
        // En desarrollo, podemos continuar sin error
        migrationsRun = true;
      }
      
    } catch (error: any) {
      console.error('❌ Error al ejecutar migraciones:', error);
      
      // En Vercel, no fallar si no encuentra las migraciones
      // El sistema usará migraciones SQL directas que ya están implementadas
      if (process.env.VERCEL) {
        console.warn('⚠️ Error en migraciones Drizzle en Vercel. Continuando con migraciones SQL directas.');
        migrationsRun = true;
        return;
      }
      
      // En desarrollo, no fallar - permitir que la app continúe
      if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️ Continuando sin migraciones (modo desarrollo)');
        migrationsRun = true;
      } else {
        // En producción (pero no Vercel), fallar para forzar migraciones explícitas
        migrationsRun = false;
        migrationsPromise = null;
        throw error;
      }
    }
  })();

  return migrationsPromise;
}
