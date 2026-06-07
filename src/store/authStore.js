import { create } from 'zustand'
import { persist } from 'zustand/middleware'
 
const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      organisation: null,
      accessToken: null,
      refreshToken: null,
 
      setAuth: ({ user, organisation, accessToken, refreshToken }) =>
        set({ user, organisation, accessToken, refreshToken }),
 
      clearAuth: () =>
        set({ user: null, organisation: null, accessToken: null, refreshToken: null }),
 
      isAuthenticated: () => !!get().accessToken && !!get().user,
 
      updateTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),
    }),
    { name: 'hrms-auth' }
  )
)
 
export default useAuthStore