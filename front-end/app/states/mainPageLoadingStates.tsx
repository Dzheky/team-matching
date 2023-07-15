import { create } from "zustand";

export type LoadingStateTypes =
  | "resetAll"
  | "generateMembers"
  | "generateTeams"
  | "loadingMembers"
  | "loadingTeams"
  | "matchingTeams";

type LoadingState = {
  resetAll: boolean;
  generateMembers: boolean;
  generateTeams: boolean;
  matchingTeams: boolean;
};

type LoadingActions = {
  setIsLoading: (isLoading: boolean, loadingType: LoadingStateTypes) => void;
};

export const useMainPageLoading = create<LoadingState & LoadingActions>(
  (set) => ({
    resetAll: false,
    generateMembers: false,
    generateTeams: false,
    loadingMembers: false,
    loadingTeams: false,
    matchingTeams: false,
    setIsLoading: (isLoading, loadingType) => {
      set((state) => ({ ...state, [loadingType]: isLoading }));
    },
  }),
);
