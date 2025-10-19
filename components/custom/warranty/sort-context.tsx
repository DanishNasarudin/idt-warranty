"use client";
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
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocalStorage } from "usehooks-ts";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import SortModuleDraggable from "./sort-draggable";

export type SortColumnType = {
  id: string;
  name: string;
  direction: "asc" | "desc";
};

const sortColumns: SortColumnType[] = [
  {
    id: "updatedAt",
    name: "Last updated",
    direction: "desc",
  },
  {
    id: "name",
    name: "Project Name",
    direction: "desc",
  },
  {
    id: "ownerId",
    name: "Owner",
    direction: "desc",
  },
];

export type SortModuleType = {
  columnOptions?: SortColumnType[];
  defaultOption?: string;
  sortArrayId?: string;
};

const SortModuleContext = ({
  columnOptions = sortColumns,
  defaultOption = "updatedAt:desc",
  sortArrayId = "my-sort-order",
}: SortModuleType) => {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const pathname = usePathname();

  const [sortingList, setSortingList] = useLocalStorage<SortColumnType[]>(
    sortArrayId,
    [columnOptions[0]]
  );
  const [activeId, setActiveId] = useLocalStorage<string | null>(
    "my-sort-active",
    null
  );

  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalEl(document.body);
  }, []);

  const didMount = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setSortingList((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        if (oldIndex === -1 || newIndex === -1) {
          return items;
        }

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSortingAdd = (e: string) => {
    const selectedColumn = columnOptions.find((item) => item.id === e);
    if (selectedColumn) {
      setSortingList((prev) => {
        const cleanup = prev.filter((item) =>
          columnOptions.some((col) => col.id === item.id)
        );
        const exist = cleanup.some((item) => item.id === e);
        if (exist) return cleanup;

        return [...cleanup, selectedColumn];
      });
    }
  };

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    const cleanSortList = sortingList.filter((l) =>
      columnOptions.some((c) => c.id === l.id)
    );

    const newSortString = cleanSortList
      .map((s) => `${s.id}:${s.direction}`)
      .join(",");

    // skip if no change
    if (!searchParams.has("sort") && newSortString === defaultOption) {
      return;
    }

    const current = searchParams.get("sort") ?? "";
    if (current === newSortString) {
      // nothing changed, bail
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);

    if (newSortString) {
      urlParams.set("sort", newSortString);
    } else {
      urlParams.delete("sort");
    }

    replace(`${pathname}?${urlParams.toString()}`, { scroll: false });
  }, [sortingList, pathname, replace, searchParams]);

  return (
    <div
      className={cn(
        "border-border border-[1px] rounded-md p-1 !py-[2.5px] relative",
        "flex gap-2 items-center shadow-sm"
      )}
    >
      <DndContext
        id={"unique-dnd-context"}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="w-min flex gap-2">
          <SortableContext
            items={sortingList.filter((item) =>
              columnOptions.some((col) => col.id === item.id)
            )}
            strategy={horizontalListSortingStrategy}
          >
            {sortingList
              .filter((item) => columnOptions.some((col) => col.id === item.id))
              .map((item) => (
                <SortModuleDraggable
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  direction={item.direction}
                  setSortingList={setSortingList}
                />
              ))}
          </SortableContext>
        </div>
        {portalEl &&
          createPortal(
            <DragOverlay>
              {activeId ? (
                <SortModuleDraggable
                  id={activeId}
                  name={
                    sortingList
                      .filter((item) =>
                        columnOptions.some((col) => col.id === item.id)
                      )
                      .find((item) => item.id === activeId)?.name
                  }
                  direction={
                    sortingList
                      .filter((item) =>
                        columnOptions.some((col) => col.id === item.id)
                      )
                      .find((item) => item.id === activeId)?.direction
                  }
                  setSortingList={setSortingList}
                />
              ) : null}
            </DragOverlay>,
            portalEl
          )}
      </DndContext>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={"nothing"}
            size={"sm"}
            className={cn("mobilehover:hover:bg-white/20 h-6")}
          >
            + Add Sort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup onValueChange={handleSortingAdd}>
            {columnOptions
              .filter(
                (item) =>
                  !sortingList
                    .filter((item) =>
                      columnOptions.some((col) => col.id === item.id)
                    )
                    .some((active) => active.id === item.id)
              )
              .map((item) => (
                <DropdownMenuRadioItem value={item.id} key={item.id}>
                  {item.name}
                </DropdownMenuRadioItem>
              ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SortModuleContext;
