// ============================== New label / upload ==============================

import pLimit from "p-limit"
import { create } from "zustand"
import type { LabelImageDetail } from "#/api/types.gen"
import { getContext } from "#/integrations/tanstack-query/root-provider"

// ============================== Types ==============================
export type FileUploadStatus =
  | "pending"
  | "requesting"
  | "uploading"
  | "success"
  | "failed"

export type FileUploadState = {
  file: File
  status: FileUploadStatus
  error?: string
  progress?: number
  storageFilePath?: string
  currentImageCount?: number
  imageId?: string
}

export type LabelUploadApi = {
  createLabel: (productType: string) => Promise<{ id: string }>
  uploadLabelImage: (
    labelId: string,
    displayFilename: string,
    contentType: "image/png" | "image/jpeg" | "image/webp",
    sequenceOrder: number,
    file: File,
  ) => Promise<LabelImageDetail>
}

type LabelNewStore = {
  uploadedFiles: File[]
  uploadStatesByLabelId: Map<string, Map<number, FileUploadState>>
  labelId: string | null
  isProcessing: boolean
  imageLimitExceeded: boolean
  fileTypeValidationErrors: string[]
  setUploadedFiles: (files: File[]) => void
  addUploadedFiles: (files: File[]) => void
  removeFile: (index: number) => void
  clearAll: () => void
  setIsProcessing: (processing: boolean) => void
  addFileTypeValidationErrors: (errors: string[]) => void
  clearFileTypeValidationErrors: () => void
  process: (
    productType: string,
    navigateToFiles: (labelId: string) => void,
    api: LabelUploadApi,
  ) => Promise<void>
  getCurrentUploadStates: () => Map<number, FileUploadState>
  getUploadStates: (labelId: string) => Map<number, FileUploadState> | undefined
}

// ============================== Helpers ==============================
const MAX_CONCURRENT_UPLOADS = 3

const store = (set: any, get: () => LabelNewStore) => {
  const limit = pLimit(MAX_CONCURRENT_UPLOADS)
  return {
    uploadedFiles: [],
    uploadStatesByLabelId: new Map<string, Map<number, FileUploadState>>(),
    labelId: null,
    isProcessing: false,
    imageLimitExceeded: false,
    fileTypeValidationErrors: [],
    setUploadedFiles: (files: File[]) =>
      set({
        uploadedFiles: files,
        labelId: null,
        imageLimitExceeded: false,
      }),
    addUploadedFiles: (files: File[]) =>
      set((state: LabelNewStore) => ({
        uploadedFiles: [...state.uploadedFiles, ...files],
      })),
    removeFile: (index: number) =>
      set((state: LabelNewStore) => {
        const labelId = state.labelId
        if (labelId) {
          const labelStates = state.uploadStatesByLabelId.get(labelId)
          if (labelStates) {
            const newLabelStates = new Map(labelStates)
            newLabelStates.delete(index)
            const newStatesByLabelId = new Map(state.uploadStatesByLabelId)
            newStatesByLabelId.set(labelId, newLabelStates)
            return {
              uploadedFiles: state.uploadedFiles.filter((_, i) => i !== index),
              uploadStatesByLabelId: newStatesByLabelId,
            }
          }
        }
        return {
          uploadedFiles: state.uploadedFiles.filter((_, i) => i !== index),
        }
      }),
    clearAll: () =>
      set({
        uploadedFiles: [],
        labelId: null,
        imageLimitExceeded: false,
        fileTypeValidationErrors: [],
      }),
    addFileTypeValidationErrors: (errors: string[]) =>
      set((state: LabelNewStore) => ({
        fileTypeValidationErrors: [
          ...state.fileTypeValidationErrors,
          ...errors,
        ],
      })),
    clearFileTypeValidationErrors: () => set({ fileTypeValidationErrors: [] }),
    setIsProcessing: (processing: boolean) => set({ isProcessing: processing }),
    getCurrentUploadStates: () => {
      const state = get()
      if (!state.labelId) {
        return new Map<number, FileUploadState>()
      }
      return (
        state.uploadStatesByLabelId.get(state.labelId) ||
        new Map<number, FileUploadState>()
      )
    },
    getUploadStates: (labelId: string) => {
      const state = get()
      return state.uploadStatesByLabelId.get(labelId)
    },
    process: async (
      productType: string,
      navigateToFiles: (labelId: string) => void,
      api: LabelUploadApi,
    ) => {
      const state = get()
      if (state.uploadedFiles.length === 0 || state.isProcessing) return
      set({
        isProcessing: true,
        imageLimitExceeded: false,
        fileTypeValidationErrors: [],
      })
      const { queryClient } = getContext()
      try {
        const label = await api.createLabel(productType)
        const labelId = label.id
        set({ labelId })
        navigateToFiles(labelId)
        const files = state.uploadedFiles
        const initialStates = new Map<number, FileUploadState>()
        files.forEach((file, index) => {
          initialStates.set(index, {
            file,
            status: "pending",
          })
        })
        set((s: LabelNewStore) => {
          const newStatesByLabelId = new Map(s.uploadStatesByLabelId)
          newStatesByLabelId.set(labelId, initialStates)
          return { uploadStatesByLabelId: newStatesByLabelId }
        })
        const updateState = (
          index: number,
          updates: Partial<FileUploadState>,
        ) => {
          set((s: LabelNewStore) => {
            const labelStates = s.uploadStatesByLabelId.get(labelId)
            if (!labelStates) return s
            const newLabelStates = new Map(labelStates)
            const current = newLabelStates.get(index) || {
              file: files[index],
              status: "pending" as const,
            }
            newLabelStates.set(index, { ...current, ...updates })
            const newStatesByLabelId = new Map(s.uploadStatesByLabelId)
            newStatesByLabelId.set(labelId, newLabelStates)
            return { uploadStatesByLabelId: newStatesByLabelId }
          })
        }
        const uploadPromises = files.map((file, index) =>
          limit(async () => {
            if (get().imageLimitExceeded) {
              updateState(index, {
                status: "failed",
                error: "Upload limit exceeded. Cannot upload more files.",
              })
              return
            }
            try {
              updateState(index, { status: "requesting" })
              const contentType = file.type as
                | "image/png"
                | "image/jpeg"
                | "image/webp"
              updateState(index, { status: "uploading", progress: 0 })
              const completedImage = await api.uploadLabelImage(
                labelId,
                file.name,
                contentType,
                index + 1,
                file,
              )
              updateState(index, {
                status: "success",
                progress: 100,
                storageFilePath: completedImage.file_path,
                currentImageCount:
                  completedImage.current_image_count ?? undefined,
                imageId: completedImage.id,
              })
              queryClient.setQueryData<LabelImageDetail[]>(
                ["labels", labelId, "images"],
                (oldData = []) => {
                  const existingIndex = oldData.findIndex(
                    (img) => img.id === completedImage.id,
                  )
                  if (existingIndex >= 0) {
                    const newData = [...oldData]
                    newData[existingIndex] = completedImage
                    return newData
                  }
                  return [...oldData, completedImage]
                },
              )
            } catch (error) {
              const err = error as Error
              const isLimitError = err.message.includes("Maximum")
              if (isLimitError) {
                set({ imageLimitExceeded: true })
              }
              updateState(index, { status: "failed", error: err.message })
            }
          }),
        )
        await Promise.allSettled(uploadPromises)
        set((s: LabelNewStore) => {
          const newStatesByLabelId = new Map(s.uploadStatesByLabelId)
          newStatesByLabelId.delete(labelId)
          return { uploadStatesByLabelId: newStatesByLabelId }
        })
      } finally {
        set({ isProcessing: false })
      }
    },
  }
}

export const useLabelNew = create<LabelNewStore>()(store)
