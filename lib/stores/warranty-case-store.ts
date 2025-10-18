"use client";

import { StaffOption, WarrantyCaseWithRelations } from "@/lib/types/warranty";
import { create } from "zustand";

type WarrantyCaseStore = {
  cases: WarrantyCaseWithRelations[];
  staffOptions: StaffOption[];
  expandedRows: Set<number>;

  // Actions
  setCases: (cases: WarrantyCaseWithRelations[]) => void;
  setStaffOptions: (staff: StaffOption[]) => void;
  updateCase: (
    caseId: number,
    updates: Partial<WarrantyCaseWithRelations>
  ) => void;
  deleteCase: (caseId: number) => void;
  toggleRowExpansion: (caseId: number) => void;

  // Socket.io preparation - will be used for real-time updates
  handleRemoteUpdate: (
    caseId: number,
    updates: Partial<WarrantyCaseWithRelations>
  ) => void;
};

export const useWarrantyCaseStore = create<WarrantyCaseStore>((set, get) => ({
  cases: [],
  staffOptions: [],
  expandedRows: new Set(),

  setCases: (cases) => set({ cases }),

  setStaffOptions: (staff) => set({ staffOptions: staff }),

  updateCase: (caseId, updates) =>
    set((state) => ({
      cases: state.cases.map((c) =>
        c.id === caseId ? { ...c, ...updates } : c
      ),
    })),

  deleteCase: (caseId) =>
    set((state) => ({
      cases: state.cases.filter((c) => c.id !== caseId),
      expandedRows: new Set(
        Array.from(state.expandedRows).filter((id) => id !== caseId)
      ),
    })),

  toggleRowExpansion: (caseId) =>
    set((state) => {
      const newExpandedRows = new Set(state.expandedRows);
      if (newExpandedRows.has(caseId)) {
        newExpandedRows.delete(caseId);
      } else {
        newExpandedRows.add(caseId);
      }
      return { expandedRows: newExpandedRows };
    }),

  handleRemoteUpdate: (caseId, updates) => {
    console.log("[Store] handleRemoteUpdate called:", { caseId, updates });
    const currentCases = get().cases;
    console.log("[Store] Current cases count:", currentCases.length);
    const targetCase = currentCases.find((c) => c.id === caseId);
    console.log("[Store] Target case found:", targetCase ? "yes" : "no");

    set((state) => {
      const updatedCases = state.cases.map((c) =>
        c.id === caseId ? { ...c, ...updates } : c
      );
      console.log("[Store] Updated cases count:", updatedCases.length);
      return { cases: updatedCases };
    });
  },
}));
