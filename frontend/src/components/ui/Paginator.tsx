import { Button } from "./Button";

interface PaginatorProps {
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Paginator({ page, perPage, total, onPageChange }: PaginatorProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="flex items-center justify-end gap-3 text-sm text-slate-600 dark:text-slate-300">
      <span>
        Pagina {page} de {totalPages}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={!canPrev}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={!canNext}>
          Siguiente
        </Button>
      </div>
    </div>
  );
}
