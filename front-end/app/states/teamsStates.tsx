import { Member, Team } from "@/app/matchingTypes";
import { create } from "zustand";

type TeamsStates = {
  teams: Team[];
  isLoading: boolean;
  isModalOpen: boolean;
  teamToEdit: Team | null;
};

type TeamsActions = {
  setTeams: (teams: Team[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  fetchTeams: () => void;
  addMembers: (teamId: string, members: Member[]) => void;
  closeEditModal: () => void;
  openEditModal: (team?: Team) => void;
  editTeam: (team: Team) => Promise<{ success: boolean }>;
  deleteTeam: (team: Team) => Promise<{ success: boolean }>;
  addTeam: (team: Team) => Promise<{ success: boolean }>;
};

export const useTeams = create<TeamsStates & TeamsActions>((set) => ({
  teams: [],
  isLoading: true,
  isModalOpen: false,
  teamToEdit: null,
  setTeams: (teams) => {
    set((state) => ({ ...state, teams }));
  },
  setIsLoading: (isLoading) => {
    set((state) => ({ ...state, isLoading }));
  },
  openEditModal: (team) => {
    set((state) => ({ ...state, isModalOpen: true, teamToEdit: team }));
  },
  closeEditModal: () => {
    set((state) => ({ ...state, isModalOpen: false, teamToEdit: null }));
  },
  deleteTeam: (team) => {
    const teams = useTeams.getState().teams;
    return fetch("http://127.0.0.1:5000/team/" + team.id, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.message === "OK") {
          const newTeams = teams.filter((t) => {
            return t.id !== team.id;
          });
          set((state) => ({ ...state, teams: newTeams }));
          return { success: true };
        } else {
          set((state) => ({ ...state, teams }));
          return { success: false };
        }
      })
      .catch((e) => {
        set((state) => ({ ...state, teams }));
        return { success: false };
      });
  },
  editTeam: (team) => {
    let index = -1;
    const teams = useTeams.getState().teams;
    for (let i = 0; i < teams.length; i++) {
      if (teams[i].id === team.id) {
        index = i;
        break;
      }
    }
    const copyCurrentTeam = { ...teams[index] };

    let reset = () => {
      teams[index] = copyCurrentTeam;
      set((state) => ({ ...state, teams }));
    };

    return fetch("http://127.0.0.1:5000/team/" + team.id, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(team),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          teams[index] = team;
          set((state) => ({ ...state, teams }));
          return { success: true };
        } else {
          reset();
          return { success: false };
        }
      })
      .catch((e) => {
        reset();
        return { success: false };
      });
  },
  addTeam: (team) => {
    const teams = useTeams.getState().teams;
    const newTeams = [...teams, team];
    set((state) => ({ ...state, teams: newTeams }));
    return fetch("http://127.0.0.1:5000/teams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(team),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          return { success: true };
        } else {
          set((state) => ({ ...state, teams }));
          return { success: false };
        }
      })
      .catch((e) => {
        set((state) => ({ ...state, teams }));
        return { success: false };
      });
  },
  fetchTeams: () => {
    set((state) => ({ ...state, isLoading: true }));
    fetch("http://127.0.0.1:5000/teams")
      .then((res) => res.json())
      .then((data) => {
        set((state) => ({ ...state, teams: data, isLoading: false }));
      });
  },
  addMembers: (teamId, members) => {
    set((state) => {
      const teams = state.teams.map((team) => {
        if (team.id === teamId) {
          return { ...team, members: members };
        }
        return team;
      });
      return { ...state, teams };
    });
  },
}));
