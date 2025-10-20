"use client";
import { useTaskStore } from "@/lib/zustand";
import { Task, TaskUpdatableFields, updateTasks } from "@/services/task";
import equal from "fast-deep-equal";
import { useCallback, useEffect, useMemo, useRef } from "react";

export default function AutoSaveManager({
  projectId,
  data,
  mergeIds = [],
}: {
  projectId: string;
  data: Task[];
  mergeIds?: number[];
}) {
  const zusTasks = useTaskStore((state) => state.tasks);
  const staticTasks = useTaskStore((state) => state.staticTasks);
  const setTasks = useTaskStore((state) => state.setTasks);
  const setStaticTasks = useTaskStore((state) => state.setStaticTasks);
  const setIsSaved = useTaskStore((state) => state.setIsSaved);

  const dataChanged = !equal(staticTasks, data);

  const tasks = useMemo(
    () => (dataChanged ? data : zusTasks),
    [dataChanged, data, zusTasks]
  );

  const lastSavedRef = useRef<Task[]>(tasks);
  const isSavingRef = useRef(false);
  const pendingRef = useRef(false);
  const timerRef = useRef<number>(0);

  const hasPendingChanges = useCallback((): boolean => {
    const initialMap = new Map(lastSavedRef.current.map((t) => [t.id, t]));
    return tasks.some((t) => {
      const orig = initialMap.get(t.id);
      if (!orig) return true;
      return Object.keys(diffTask(orig, t)).length > 0;
    });
  }, [tasks]);

  const flushChanges = useCallback(async () => {
    if (isSavingRef.current) {
      pendingRef.current = true;
      return;
    }
    isSavingRef.current = true;

    const snapshot = tasks;
    const initial = lastSavedRef.current;
    const initialMap = new Map(initial.map((t) => [t.id, t]));

    type UpdatePayload = { id: number; data: Partial<TaskUpdatableFields> };
    const updatesPayload: UpdatePayload[] = [];

    for (const t of tasks) {
      const orig = initialMap.get(t.id);
      if (!orig) continue;
      const diff = diffTask(orig, t);
      if (Object.keys(diff).length > 0) {
        updatesPayload.push({ id: t.id, data: diff });
      }
    }

    if (updatesPayload.length > 0) {
      await updateTasks(projectId, updatesPayload);
      lastSavedRef.current = snapshot;
    }

    isSavingRef.current = false;
    setIsSaved(true);
    if (pendingRef.current) {
      pendingRef.current = false;
      scheduleSave();
    }
  }, [tasks]);

  const scheduleSave = useCallback(() => {
    if (!hasPendingChanges()) {
      setIsSaved(true);
      return;
    }
    setIsSaved(false);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(flushChanges, 2000);
  }, [flushChanges, hasPendingChanges, setIsSaved]);

  useEffect(() => {
    setTasks(data);
    setStaticTasks(data);
    lastSavedRef.current = data;
  }, [data]);

  useEffect(() => {
    scheduleSave();
    return () => window.clearTimeout(timerRef.current);
  }, [tasks, scheduleSave]);

  return <></>;
}

function diffTask(orig: Task, curr: Task): Partial<TaskUpdatableFields> {
  const diff: Partial<TaskUpdatableFields> = {};
  if (curr.taskName !== orig.taskName) diff.taskName = curr.taskName;
  if (curr.start.getTime() !== orig.start.getTime()) diff.start = curr.start;
  if (curr.end!.getTime() !== orig.end.getTime()) diff.end = curr.end;
  if (curr.progress !== orig.progress) diff.progress = curr.progress;
  if (!equal(curr.resources, orig.resources)) diff.resources = curr.resources;
  if (curr.color !== orig.color) diff.color = curr.color;
  if (curr.sortId !== orig.sortId) diff.sortId = curr.sortId;
  return diff;
}
