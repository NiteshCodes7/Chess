import { create } from "zustand";

type Invite = { 
    inviteId: string; 
    from: string ;
    fromName: string;
} | null;

type InviteStore = {
  invite: Invite;
  setInvite: (invite: Invite) => void;
  clearInvite: () => void;
};

export const useInviteStore = create<InviteStore>((set) => ({
  invite: null,
  setInvite: (invite) => set({ invite }),
  clearInvite: () => set({ invite: null }),
}));
