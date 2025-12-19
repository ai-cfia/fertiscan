import { create } from "zustand";

/**
 * Represents the UI state of the application.
 */
interface UIState {
  /**
   * Indicates whether the sidebar is open.
   */
  sidebarOpen: boolean;

  /**
   * Toggles the state of the sidebar between open and closed.
   */
  toggleSidebar: () => void;

  /**
   * Opens the sidebar.
   */
  openSidebar: () => void;

  /**
   * Closes the sidebar.
   */
  closeSidebar: () => void;
}

/**
 * A Zustand store for managing the UI state.
 *
 * @typedef {Object} UIState - The state object for the UI store.
 * @property {boolean} sidebarOpen - Indicates whether the sidebar is open or closed.
 *
 * @function toggleSidebar
 * Toggles the state of the sidebar between open and closed.
 *
 * @function openSidebar
 * Opens the sidebar by setting `sidebarOpen` to true.
 *
 * @function closeSidebar
 * Closes the sidebar by setting `sidebarOpen` to false.
 *
 * @returns {UIState} The Zustand store for managing the UI state.
 */
const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,

  toggleSidebar: () => {
    set((state) => {
      console.debug(`[UI Store] Toggle sidebar: ${!state.sidebarOpen}`);
      return { sidebarOpen: !state.sidebarOpen };
    });
  },

  openSidebar: () => {
    console.debug(`[UI Store] Open sidebar`);
    set({ sidebarOpen: true });
  },

  closeSidebar: () => {
    console.debug(`[UI Store] Close sidebar`);
    set({ sidebarOpen: false });
  },
}));

export default useUIStore;
