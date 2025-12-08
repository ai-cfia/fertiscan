import FileUploaded from "@/classes/File";
import { create } from "zustand";

/**
 * Interface representing the state of uploaded files and the actions that can be performed on them.
 */
interface UploadedFilesState {
  /**
   * Array of uploaded files.
   */
  uploadedFiles: FileUploaded[];

  /**
   * Adds a new file to the uploaded files array.
   * @param file - The file to be added.
   */
  addUploadedFile: (file: FileUploaded) => void;

  /**
   * Removes a file from the uploaded files array based on its path.
   * @param path - The path of the file to be removed.
   */
  removeUploadedFile: (path: string) => void;

  /**
   * Clears all uploaded files from the array.
   */
  clearUploadedFiles: () => void;

  /**
   * Renames an uploaded file based on its path.
   * @param path - The path of the file to be renamed.
   * @param newName - The new name for the file.
   */
  renameUploadedFile: (path: string, newName: string) => void;

  /**
   * Sets the uploaded files array directly.
   * @param files - The new array of uploaded files.
   */
  setUploadedFiles: (files: FileUploaded[]) => void;
}

/**
 * A Zustand store for managing uploaded files.
 *
 * @typedef {Object} UploadedFilesState
 * @property {Array<FileUploaded>} uploadedFiles - An array of uploaded files.
 * @function addUploadedFile - Adds a file to the store.
 * @function removeUploadedFile - Removes a file from the store by its path.
 * @function clearUploadedFiles - Clears all files from the store.
 * @function renameUploadedFile - Renames a file in the store by its path.
 * @function setUploadedFiles - Replaces the entire uploaded files array.
 *
 * @returns {UploadedFilesState} The state and actions for managing uploaded files.
 */
const useUploadedFilesStore = create<UploadedFilesState>((set) => ({
  uploadedFiles: [],

  addUploadedFile: (file) => {
    console.debug(`[File Store] Added: ${file.getInfo().path}`);
    set((state) => ({ uploadedFiles: [...state.uploadedFiles, file] }));
  },

  removeUploadedFile: (path) => {
    console.debug(`[File Store] Removed: ${path}`);
    set((state) => ({
      uploadedFiles: state.uploadedFiles.filter(
        (file) => file.getInfo().path !== path,
      ),
    }));
  },

  clearUploadedFiles: () => {
    console.log("[File Store] Cleared all files");
    set({ uploadedFiles: [] });
  },

  renameUploadedFile: (path, newName) => {
    console.debug(`[File Store] Renamed: ${path} -> ${newName}`);
    set((state) => ({
      uploadedFiles: state.uploadedFiles.map((file) => {
        if (file.getInfo().path === path) {
          file.getInfo().name = newName;
        }
        return file;
      }),
    }));
  },

  setUploadedFiles: (files) => {
    console.debug("[File Store] Set uploaded files");
    set({ uploadedFiles: files });
  },
}));

export default useUploadedFilesStore;
