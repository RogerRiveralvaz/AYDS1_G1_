import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  loading?: boolean;
  emptyState?: React.ReactNode;
  manualSorting?: boolean;
  pageSize?: number;
}

export function DataTable<TData>({
  data,
  columns,
  loading,
  emptyState,
  manualSorting = false,
  pageSize = 10,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    manualSorting,
  });

  const rows = table.getRowModel().rows;

  const content = useMemo(() => {
    if (loading) {
      return (
        <tbody>
          {Array.from({ length: 3 }).map((_, rowIndex) => (
            <tr key={`skeleton-${rowIndex}`} className="border-b border-slate-100 dark:border-slate-800">
              {columns.map((column, cellIndex) => (
                <td key={`${String(column.id ?? cellIndex)}-${rowIndex}`} className="px-4 py-3">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      );
    }

    if (rows.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={columns.length} className="px-4 py-6 text-center text-sm text-slate-500">
              {emptyState ?? "Sin resultados"}
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {rows.slice(0, pageSize).map((row) => (
          <tr key={row.id} className="border-b border-slate-100 text-sm hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/70">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="px-4 py-3 align-middle">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }, [rows, loading, columns, emptyState, pageSize]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-800">
      <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-900/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                return (
                  <th key={header.id} scope="col" className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">
                    {canSort ? (
                      <Button
                        variant="ghost"
                        className="-ml-2 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:bg-transparent hover:text-blue-600 dark:text-slate-200"
                        onClick={header.column.getToggleSortingHandler() ?? undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className="text-xs">
                          {{ asc: "▲", desc: "▼" }[header.column.getIsSorted() as string] ?? ""}
                        </span>
                      </Button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        {content}
      </table>
    </div>
  );
}
