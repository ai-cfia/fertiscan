import { LabelData } from "@/types/types";
import { create } from "zustand";

/**
 * Interface representing the state of label data.
 */
interface LabelDataState {
  /**
   * The current label data.
   */
  labelData: LabelData | null;

  /**
   * Sets the label data to the provided new data.
   * @param newData - The new label data to set.
   */
  setLabelData: (newData: LabelData) => void;

  /**
   * Sets a comment for the label data.
   * @param comment - The comment to set.
   */
  setComment: (comment: string) => void;

  /**
   * Resets the label data to its initial state.
   */
  resetLabelData: () => void;
}

/**
 * A Zustand store for managing label data state.
 *
 * @typedef {Object} LabelDataState
 * @property {any} labelData - The current label data.
 * @function setLabelData - Function to set new label data.
 * @function setComment - Function to set a comment on the label data.
 * @function resetLabelData - Function to reset the label data to null.
 *
 * @returns {LabelDataState} The Zustand store for label data.
 */
const useLabelDataStore = create<LabelDataState>((set) => ({
  labelData: null,

  setLabelData: (newData) => {
    console.debug(`[Label Store] Set label data:`, newData);
    set({ labelData: newData });
  },

  setComment: (comment) => {
    console.debug(`[Label Store] Set comment:`, comment);
    set((state) => ({
      labelData: state.labelData ? { ...state.labelData, comment } : null,
    }));
  },

  resetLabelData: () => {
    console.debug(`[Label Store] Reset label data`);
    set({ labelData: null });
  },
}));

export default useLabelDataStore;
