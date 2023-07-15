import { Member } from "@/app/matchingTypes";
import { create } from "zustand";
import { setNotifications } from "@/app/components/notifications";

type MemberStates = {
  members: Member[];
  memberToEdit: Member | null;
  isLoading: boolean;
};

type MemberActions = {
  setMembers: (members: Member[]) => void;
  editMember: (member: Member) => Promise<{ success: boolean }>;
  addMember: (member: Member) => Promise<{ success: boolean }>;
  deleteMember: (member: Member) => Promise<{ success: boolean }>;
  setIsLoading: (isLoading: boolean) => void;
  fetchMembers: () => void;
  openEditModal: (member: Member) => void;
  closeEditModal: () => void;
};

export const useMembers = create<MemberStates & MemberActions>((set) => ({
  members: [],
  isLoading: false,
  memberToEdit: null,
  setMembers: (members) => {
    set((state) => ({ ...state, members }));
  },
  setIsLoading: (isLoading) => {
    set((state) => ({ ...state, isLoading }));
  },
  fetchMembers: () => {
    set((state) => ({ ...state, isLoading: true }));
    fetch("http://127.0.0.1:5000/members")
      .then((res) => res.json())
      .then((data) => {
        set((state) => ({ ...state, members: data, isLoading: false }));
      });
  },
  openEditModal: (member) => {
    set((state) => ({ ...state, memberToEdit: member }));
  },
  closeEditModal: () => {
    set((state) => ({ ...state, memberToEdit: null }));
  },
  editMember: (member) => {
    let index = -1;
    const members = useMembers.getState().members;
    for (let i = 0; i < members.length; i++) {
      if (members[i].id === member.id) {
        index = i;
        break;
      }
    }
    const copyCurrentMember = { ...members[index] };

    let reset = () => {
      members[index] = copyCurrentMember;
      set((state) => ({ ...state, members }));
    };

    if (index !== -1) {
      members[index] = member;
      set((state) => ({ ...state, members }));
      return fetch("http://127.0.0.1:5000/member/" + member.id, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(member),
      })
        .then((res) => {
          if (res.status !== 200) {
            setNotifications("error", res.statusText);
            reset();
            return { success: false };
          }
          return { success: true };
        })
        .catch((err) => {
          console.error(err);
          setNotifications("error", "Error while updating member");
          reset();
          return { success: false };
        });
    } else {
      reset();
      setNotifications("error", "Member not found");
      return Promise.resolve({ success: false });
    }
  },
  addMember: async (member) => {
    const members = useMembers.getState().members;
    const copyCurrentMembers = [...members];

    let reset = () => {
      set((state) => ({ ...state, members: copyCurrentMembers }));
    };
    try {
      const result = await fetch("http://127.0.0.1:5000/member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(member),
      });
      if (result.status !== 200) {
        setNotifications("error", result.statusText);
        reset();
        return { success: false };
      }

      set((state) => ({ ...state, members: [...members, member] }));

      return { success: true };
    } catch (err) {
      console.error(err);
      setNotifications("error", "Error while adding member");
      reset();
      return { success: false };
    }
  },
  deleteMember: (member) => {
    const members = useMembers.getState().members;
    const copyCurrentMembers = [...members];

    let reset = () => {
      set((state) => ({ ...state, members: copyCurrentMembers }));
    };

    return fetch("http://127.0.0.1:5000/member/" + member.id, {
      method: "DELETE",
    })
      .then((res) => {
        if (res.status !== 200) {
          setNotifications("error", res.statusText);
          reset();
          return { success: false };
        }
        set((state) => ({
          ...state,
          members: members.filter((m) => m.id !== member.id),
        }));

        return { success: true };
      })
      .catch((err) => {
        console.error(err);
        setNotifications("error", "Error while deleting member");
        reset();
        return { success: false };
      });
  },
}));
