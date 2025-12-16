import { Alert, AlertSeverity } from "@/types/types";
import { create } from "zustand";

/**
 * Represents the state and actions for managing alerts.
 */
interface AlertState {
  /**
   * The current alert being displayed, or null if no alert is active.
   */
  alert: Alert | null;

  /**
   * Displays an alert with the given message and optional severity type.
   *
   * @param message - The message to display in the alert.
   * @param type - The severity type of the alert (optional).
   */
  showAlert: (message: string, type?: AlertSeverity) => void;

  /**
   * Hides the currently displayed alert.
   */
  hideAlert: () => void;
}

/**
 * A Zustand store for managing alert state.
 *
 * @typedef {Object} AlertState
 * @property {Object|null} alert - The current alert object or null if no alert is shown.
 * @function showAlert - Function to display an alert with a given message and type.
 * @function hideAlert - Function to hide the current alert.
 */
const useAlertStore = create<AlertState>((set) => ({
  alert: null,
  showAlert: (message, type = "info") => {
    console.debug(`Alert: ${message} | Type: ${type}`);
    set({ alert: { message, type } });
  },
  hideAlert: () => set({ alert: null }),
}));

export default useAlertStore;
