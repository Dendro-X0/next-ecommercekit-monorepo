import { create } from "zustand"

type SidebarStore = {
  isOpen: boolean
  toggleSidebar: () => void
}

export const useSidebar = create<SidebarStore>((set) => ({
  isOpen: true,
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
}))
