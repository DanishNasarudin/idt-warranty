"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "../../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

import { cn } from "@/lib/utils";
import {
  ChevronsDownIcon,
  ChevronsUpIcon,
  MinusCircleIcon,
} from "lucide-react";
import { Dispatch, JSX, SetStateAction, useEffect, useState } from "react";
import { SortColumnType } from "./sort-context";

type Props = {
  id?: string;
  name?: string;
  direction?: string;
  setSortingList: Dispatch<SetStateAction<SortColumnType[]>>;
};

const SortModuleDraggable = ({
  id = "default",
  name = "default",
  direction = "desc",
  setSortingList,
}: Props) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: id,
    });
  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const dragProps = {
    ref: setNodeRef,
    style,
    ...listeners,
    ...attributes,
  };

  const [position, setPosition] = useState<string>("");

  useEffect(() => {
    setPosition(direction);
    switch (direction) {
      case "asc":
        setIcon(<ChevronsUpIcon />);
        break;
      case "desc":
        setIcon(<ChevronsDownIcon />);
        break;
      case "remove":
        setIcon(<MinusCircleIcon />);
        break;
      default:
        throw new Error(`Invalid direction.`);
    }
  }, [direction]);

  const handleOnValueChange = (e: string) => {
    switch (e) {
      case "asc":
        setSortingList((prev) => {
          const newList = prev.map((item) => {
            if (item.id === id) {
              return { ...item, direction: "asc" as "asc" | "desc" };
            } else {
              return item;
            }
          });

          return newList;
        });
        setPosition("asc");
        setIcon(<ChevronsUpIcon />);
        break;
      case "desc":
        setSortingList((prev) => {
          const newList = prev.map((item) => {
            if (item.id === id) {
              return { ...item, direction: "desc" as "asc" | "desc" };
            } else {
              return item;
            }
          });

          return newList;
        });
        setPosition("desc");
        setIcon(<ChevronsDownIcon />);
        break;
      case "remove":
        setSortingList((prev) => {
          const newList = prev.filter((item) => item.id !== id);

          return newList;
        });
        setPosition("remove");
        setIcon(<MinusCircleIcon />);
        break;
      default:
        throw new Error(`Invalid selection.`);
    }
  };

  const [icon, setIcon] = useState<JSX.Element>(<MinusCircleIcon />);

  const [open, setOpen] = useState(false);

  return (
    <div
      {...(!open && dragProps)}
      className={cn(
        "flex border-border border-[1px] rounded-md bg-background",
        ""
      )}
    >
      <Button
        variant={"nothing"}
        size={"sm"}
        className="whitespace-nowrap front-normal cursor-grab text-xs h-6"
      >
        {name}
      </Button>
      <DropdownMenu onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={"nothing"}
            className="whitespace-nowrap font-normal h-6 mobilehover:hover:bg-white/20"
            size={"sm"}
          >
            {icon}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup
            value={position ? position : ""}
            onValueChange={handleOnValueChange}
          >
            <DropdownMenuRadioItem
              value={"asc"}
              indicator={false}
              className="justify-between"
            >
              Ascending <ChevronsUpIcon />
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value={"desc"}
              indicator={false}
              className="justify-between"
            >
              Descending <ChevronsDownIcon />
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value={"remove"}
              indicator={false}
              className="justify-between text-destructive!"
            >
              Remove
              <MinusCircleIcon />
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default SortModuleDraggable;
