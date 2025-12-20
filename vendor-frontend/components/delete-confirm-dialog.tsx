'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ReactNode } from 'react';

type BaseProps = {
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  itemName?: string;
  isLoading?: boolean;
};

type TriggerModeProps = BaseProps & {
  trigger: ReactNode;
  open?: never;
  onOpenChange?: never;
};

type ControlledModeProps = BaseProps & {
  trigger?: never;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export type DeleteConfirmDialogProps = TriggerModeProps | ControlledModeProps;

/**
 * Componente reutilizable para confirmar eliminación de items
 * 
 * @param title - Título del diálogo (por defecto: "¿Estás seguro?")
 * @param description - Descripción del diálogo (por defecto: genérico)
 * @param onConfirm - Función a ejecutar al confirmar
 * @param trigger - Elemento que activa el diálogo (normalmente un Button)
 * @param itemName - Nombre del item a eliminar (para personalizar mensaje)
 */
export function DeleteConfirmDialog({
  title,
  description,
  onConfirm,
  itemName,
  isLoading,
  ...rest
}: DeleteConfirmDialogProps) {
  const defaultTitle = title || '¿Estás seguro?';
  const defaultDescription =
    description ||
    `Esta acción no se puede deshacer. ${itemName ? `Se eliminará permanentemente "${itemName}".` : 'El elemento se eliminará permanentemente.'}`;

  const handleConfirm = async () => {
    await onConfirm();
    // En modo controlado, cerramos el diálogo al confirmar exitosamente.
    if ('onOpenChange' in rest && typeof rest.onOpenChange === 'function') {
      rest.onOpenChange(false);
    }
  };

  return (
    <AlertDialog {...('open' in rest ? { open: rest.open, onOpenChange: rest.onOpenChange } : {})}>
      {'trigger' in rest && rest.trigger ? (
        <AlertDialogTrigger asChild>{rest.trigger}</AlertDialogTrigger>
      ) : null}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{defaultTitle}</AlertDialogTitle>
          <AlertDialogDescription>{defaultDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={Boolean(isLoading)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={Boolean(isLoading)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

