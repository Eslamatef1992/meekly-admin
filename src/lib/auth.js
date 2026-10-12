import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(persist((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  branches: [],
  currentBranchId: null,
  isAuthenticated: () => !!get().accessToken,
  hasPerm: (code) => {
    const u = get().user;
    if (!u) return false;
    if ((u.roles || []).includes('super_admin')) return true;
    return (u.perms || []).includes(code);
  },
  setAuth: ({ accessToken, refreshToken, user, branches }) => set({
    accessToken,
    refreshToken,
    user,
    branches: branches || [],
    currentBranchId: user?.default_branch_id || (branches && branches[0]?.id) || null,
  }),
  setCurrentBranchId: (id) => set({ currentBranchId: id }),
  setBranches: (branches) => set({ branches: branches || [] }),
  logout: () => set({ accessToken: null, refreshToken: null, user: null, branches: [], currentBranchId: null }),
}), {
  name: 'mekky.auth',
  partialize: (s) => ({
    accessToken: s.accessToken,
    refreshToken: s.refreshToken,
    user: s.user,
    branches: s.branches,
    currentBranchId: s.currentBranchId,
  }),
}));
