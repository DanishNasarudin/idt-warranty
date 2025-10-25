"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  SortColumn,
  SortDirection,
  SortField,
} from "@/lib/types/search-params";
import { cn } from "@/lib/utils";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { SortChip } from "./table-sort-chip";

const SORT_FIELD_OPTIONS: Array<{ field: SortField; label: string }> = [
  { field: "createdAt", label: "Date" },
  { field: "updatedAt", label: "Last Updated" },
  { field: "serviceNo", label: "Service No" },
  { field: "customerName", label: "Customer Name" },
  { field: "status", label: "Status" },
];

type TableSortProps = {
  sortColumns: SortColumn[];
};

export function TableSort({ sortColumns }: TableSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for sort configuration
  const [activeSorts, setActiveSorts] = useState<SortColumn[]>(sortColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  // Initialize portal element on mount
  useEffect(() => {
    setPortalEl(document.body);
  }, []);

  // Sync local state when sortColumns prop changes
  useEffect(() => {
    setActiveSorts(sortColumns);
  }, [sortColumns]);

  // Configure drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update URL with new sort configuration
  const updateSort = (newSorts: SortColumn[]) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");

    if (newSorts.length === 0) {
      params.delete("sort");
    } else {
      const sortString = newSorts
        .map((s) => `${s.field}:${s.direction}`)
        .join(",");
      params.set("sort", sortString);
    }

    // Reset to page 1 when sort changes
    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname ?? ""}?${params.toString()}`, { scroll: false });
    });
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  // Handle drag end and reorder
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    setActiveSorts((items) => {
      const oldIndex = items.findIndex((item) => item.field === active.id);
      const newIndex = items.findIndex((item) => item.field === over.id);

      if (oldIndex === -1 || newIndex === -1) return items;

      const reordered = arrayMove(items, oldIndex, newIndex);
      updateSort(reordered);
      return reordered;
    });
  };

  // Toggle sort direction
  const handleToggleDirection = (field: SortField) => {
    const updated = activeSorts.map((sort) => {
      if (sort.field === field) {
        const newDirection: SortDirection =
          sort.direction === "asc" ? "desc" : "asc";
        return { ...sort, direction: newDirection };
      }
      return sort;
    });
    setActiveSorts(updated);
    updateSort(updated);
  };

  // Add a new sort column
  const handleAddSort = (value: string) => {
    const field = value as SortField;
    const newSort: SortColumn = { field, direction: "desc" };
    const updated = [...activeSorts, newSort];
    setActiveSorts(updated);
    updateSort(updated);
  };

  // Remove a sort column
  const handleRemoveSort = (field: SortField) => {
    const updated = activeSorts.filter((sort) => sort.field !== field);
    setActiveSorts(updated);
    updateSort(updated);
  };

  // Available options for adding (exclude already active sorts)
  const availableOptions = useMemo(
    () =>
      SORT_FIELD_OPTIONS.filter(
        (option) => !activeSorts.some((sort) => sort.field === option.field)
      ),
    [activeSorts]
  );

  // Get label for a field
  const getLabel = (field: SortField) =>
    SORT_FIELD_OPTIONS.find((opt) => opt.field === field)?.label || field;

  // Get the currently dragged item
  const draggedItem = useMemo(
    () => activeSorts.find((sort) => sort.field === activeId),
    [activeSorts, activeId]
  );

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border border-border p-1 shadow-sm",
        "bg-background"
      )}
    >
      <DndContext
        id="warranty-sort-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-2">
          <SortableContext
            items={activeSorts.map((s) => s.field)}
            strategy={horizontalListSortingStrategy}
          >
            {activeSorts.map((sort) => (
              <SortChip
                key={sort.field}
                field={sort.field}
                label={getLabel(sort.field)}
                direction={sort.direction}
                onToggleDirection={() => handleToggleDirection(sort.field)}
                onRemove={() => handleRemoveSort(sort.field)}
                disabled={isPending}
              />
            ))}
          </SortableContext>
        </div>

        {/* Drag Overlay */}
        {portalEl &&
          createPortal(
            <DragOverlay>
              {activeId && draggedItem ? (
                <SortChip
                  field={draggedItem.field}
                  label={getLabel(draggedItem.field)}
                  direction={draggedItem.direction}
                  onToggleDirection={() => {}}
                  onRemove={() => {}}
                  disabled={false}
                  isDragging
                />
              ) : null}
            </DragOverlay>,
            portalEl
          )}
      </DndContext>

      {/* Add Sort Dropdown */}
      {availableOptions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-6 whitespace-nowrap text-xs font-normal",
                "hover:bg-accent"
              )}
              disabled={isPending}
            >
              + Add Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup onValueChange={handleAddSort}>
              {availableOptions.map((option) => (
                <DropdownMenuRadioItem key={option.field} value={option.field}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
