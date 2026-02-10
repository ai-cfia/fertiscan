import axios, { AxiosError } from "axios"
import pLimit from "p-limit"
import { create } from "zustand"
import { type LabelImageDetail, LabelsService } from "@/api"
import { queryClient } from "@/main"

// ============================== Types ==============================
type UploadStatus =
  | "pending"
  | "requesting"
  | "uploading"
  | "success"
  | "failed"

interface FileUploadState {
  /** Original File object */
  file: File
  /** Current upload status */
  status: UploadStatus
  /** Error message if upload failed */
  error?: string
  /** Upload progress percentage (0-100) */
  progress?: number
  /** Storage file path returned from backend */
  storageFilePath?: string
  /** Current image count from backend (e.g., "2 of 5 images") */
  currentImageCount?: number
  /** Image ID returned from createLabelImage */
  imageId?: string
}

interface LabelNewStore {
  /** Selected files ready for upload (user-selected File objects) */
  uploadedFiles: File[]
  /** Per-label upload state tracking (key: labelId, value: Map<fileIndex, uploadState>) */
  uploadStatesByLabelId: Map<string, Map<number, FileUploadState>>
  /** Created label ID from backend (null until label is created) */
  labelId: string | null
  /** Whether upload process is currently running */
  isProcessing: boolean
  /** Whether the 5-image-per-label limit was exceeded (stops further uploads) */
  imageLimitExceeded: boolean
  /** File type validation error messages (e.g., invalid file types rejected during selection) */
  fileTypeValidationErrors: string[]
  /** Replace all uploaded files (resets upload states and labelId) */
  setUploadedFiles: (files: File[]) => void
  /** Add files to existing list */
  addUploadedFiles: (files: File[]) => void
  /** Remove file at given index (also removes its upload state) */
  removeFile: (index: number) => void
  /** Clear all files, upload states, and labelId */
  clearAll: () => void
  /** Set processing state (used internally during upload) */
  setIsProcessing: (processing: boolean) => void
  /** Add file type validation errors */
  addFileTypeValidationErrors: (errors: string[]) => void
  /** Clear file type validation errors */
  clearFileTypeValidationErrors: () => void
  /** Start upload workflow (create label, request presigned URLs, upload files) */
  process: (
    productType: string,
    navigate: (to: string) => void,
  ) => Promise<void>
  /** Get upload states for current labelId (for backward compatibility) */
  getCurrentUploadStates: () => Map<number, FileUploadState>
  /** Get upload states for a specific labelId */
  getUploadStates: (labelId: string) => Map<number, FileUploadState> | undefined
}

// ============================== Helper Functions ==============================
async function createLabel(productType: string): Promise<{ id: string }> {
  const response = await LabelsService.createLabel({
    body: { product_type: productType },
  })
  if (response.status !== 201 || !response.data) {
    throw new Error("Failed to create label")
  }
  return { id: response.data.id }
}

function requestPresignedUrl(
  labelId: string,
  displayFilename: string,
  contentType: "image/png" | "image/jpeg" | "image/webp",
  sequenceOrder: number,
): Promise<{ imageDetail: LabelImageDetail; presignedUrl: string }> {
  // Step 1: Create label image record
  return LabelsService.createLabelImage({
    path: { label_id: labelId },
    body: {
      display_filename: displayFilename,
      content_type: contentType,
      sequence_order: sequenceOrder,
    },
  })
    .then((createResponse) => {
      if (createResponse.status !== 201 || !createResponse.data) {
        throw new Error("Failed to create label image")
      }
      return createResponse.data
    })
    .then((imageDetail) => {
      // Step 2: Get presigned upload URL
      return LabelsService.getLabelImagePresignedUploadUrl({
        path: { label_id: labelId, image_id: imageDetail.id },
        query: { content_type: contentType },
      }).then((presignedResponse) => {
        if (presignedResponse.status !== 200 || !presignedResponse.data) {
          throw new Error("Failed to get presigned URL")
        }
        return {
          imageDetail,
          presignedUrl: presignedResponse.data.url,
        }
      })
    })
    .catch((error) => {
      // Extract error message from axios error response
      let errorMessage = "Failed to get presigned URL"
      if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as any
        if (
          data.detail &&
          Array.isArray(data.detail) &&
          data.detail.length > 0
        ) {
          // Validation error format: { detail: [{ msg: "...", ... }] }
          errorMessage = data.detail
            .map((d: any) => d.msg || d.message)
            .join(", ")
        } else if (data.message) {
          errorMessage = data.message
        } else if (typeof data.detail === "string") {
          errorMessage = data.detail
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      throw new Error(errorMessage)
    })
}

async function uploadToStorage(
  presignedUrl: string,
  file: File,
  contentType: string,
  onProgress: (progress: number) => void,
): Promise<void> {
  await axios.put(presignedUrl, file, {
    headers: { "Content-Type": contentType },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        onProgress(
          Math.round((progressEvent.loaded / progressEvent.total) * 100),
        )
      }
    },
  })
}

async function completeUpload(
  labelId: string,
  storageFilePath: string,
): Promise<LabelImageDetail> {
  return LabelsService.completeLabelImageUpload({
    path: { label_id: labelId },
    body: { storage_file_path: storageFilePath },
  })
    .then((response) => {
      if (response.status !== 200 || !response.data) {
        throw new Error("Failed to complete upload")
      }
      return response.data
    })
    .catch((error) => {
      // Extract error message from axios error response
      let errorMessage = "Failed to complete upload"
      if (error instanceof AxiosError && error.response?.data) {
        const data = error.response.data as any
        if (
          data.detail &&
          Array.isArray(data.detail) &&
          data.detail.length > 0
        ) {
          errorMessage = data.detail
            .map((d: any) => d.msg || d.message)
            .join(", ")
        } else if (data.message) {
          errorMessage = data.message
        } else if (typeof data.detail === "string") {
          errorMessage = data.detail
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      throw new Error(errorMessage)
    })
}

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
    process: async (productType: string, navigate: (to: string) => void) => {
      const state = get()
      if (state.uploadedFiles.length === 0 || state.isProcessing) return
      set({
        isProcessing: true,
        imageLimitExceeded: false,
        fileTypeValidationErrors: [],
      })
      try {
        // Create label first
        const label = await createLabel(productType)
        const labelId = label.id
        set({ labelId })
        // Navigate immediately after label creation
        navigate(`/${productType}/labels/${labelId}/files`)
        const files = state.uploadedFiles
        // Initialize upload states for this label
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
        // Helper to update upload state for a specific file
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
              status: "pending",
            }
            newLabelStates.set(index, { ...current, ...updates })
            const newStatesByLabelId = new Map(s.uploadStatesByLabelId)
            newStatesByLabelId.set(labelId, newLabelStates)
            return { uploadStatesByLabelId: newStatesByLabelId }
          })
        }
        // Process files with concurrency limit
        const uploadPromises = files.map((file, index) =>
          limit(async () => {
            // Check if image limit was exceeded (stop processing remaining files)
            if (get().imageLimitExceeded) {
              updateState(index, {
                status: "failed",
                error: "Upload limit exceeded. Cannot upload more files.",
              })
              return
            }
            try {
              // Request presigned URL
              updateState(index, { status: "requesting" })
              const contentType = file.type as
                | "image/png"
                | "image/jpeg"
                | "image/webp"
              const { imageDetail, presignedUrl } = await requestPresignedUrl(
                labelId,
                file.name,
                contentType,
                index + 1,
              )
              // Upload to storage with progress tracking
              updateState(index, {
                status: "uploading",
                storageFilePath: imageDetail.file_path,
                currentImageCount: imageDetail.current_image_count ?? undefined,
                imageId: imageDetail.id,
              })
              await uploadToStorage(
                presignedUrl,
                file,
                contentType,
                (progress) => {
                  updateState(index, { progress })
                },
              )
              // Notify backend upload completed and get updated image
              const completedImage = await completeUpload(
                labelId,
                imageDetail.file_path,
              )
              updateState(index, { status: "success", progress: 100 })
              // Update cache with completed image data
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
              // Detect limit exceeded errors: 400 status with "Maximum" in message
              let isLimitError = false
              if (error instanceof AxiosError && error.response) {
                const status = error.response.status
                const data = error.response.data as any
                const detail = data?.detail || ""
                isLimitError =
                  status === 400 &&
                  typeof detail === "string" &&
                  detail.startsWith("Maximum")
              } else if (err.message.startsWith("Maximum")) {
                // Fallback: check error message directly
                isLimitError = true
              }
              if (isLimitError) {
                set({ imageLimitExceeded: true })
              }
              updateState(index, { status: "failed", error: err.message })
            }
          }),
        )
        // Wait for all uploads to complete (success or failure)
        await Promise.allSettled(uploadPromises)
        // Clean up upload state after all uploads complete
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
