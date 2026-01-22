import { useQuery } from "@tanstack/react-query"
import { LabelsService } from "@/api"

// ============================== Label Data Queries ==============================
export function useLabelDataQueries(labelId: string, isFertilizer: boolean) {
  const labelQuery = useQuery({
    queryKey: ["label", labelId],
    queryFn: async () => {
      const response = await LabelsService.readLabel({
        path: { label_id: labelId },
      })
      return response.data
    },
    retry: false,
    throwOnError: false,
  })
  const labelDataQuery = useQuery({
    queryKey: ["labelData", labelId],
    queryFn: async () => {
      const response = await LabelsService.readLabelData({
        path: { label_id: labelId },
      })
      return response.data
    },
    retry: false,
    throwOnError: false,
  })
  const fertilizerDataQuery = useQuery({
    queryKey: ["fertilizerLabelData", labelId],
    queryFn: async () => {
      const response = await LabelsService.readFertilizerLabelData({
        path: { label_id: labelId },
      })
      return response.data
    },
    enabled: isFertilizer,
    retry: false,
    throwOnError: false,
  })
  const labelDataMetaQuery = useQuery({
    queryKey: ["labelDataMeta", labelId],
    queryFn: async () => {
      const response = await LabelsService.readLabelDataMeta({
        path: { label_id: labelId },
      })
      return response.data
    },
    retry: false,
    throwOnError: false,
  })
  const fertilizerDataMetaQuery = useQuery({
    queryKey: ["fertilizerLabelDataMeta", labelId],
    queryFn: async () => {
      const response = await LabelsService.readFertilizerLabelDataMeta({
        path: { label_id: labelId },
      })
      return response.data
    },
    enabled: isFertilizer,
    retry: false,
    throwOnError: false,
  })
  return {
    label: labelQuery.data,
    isLoadingLabel: labelQuery.isLoading,
    labelData: labelDataQuery.data,
    isLoadingData: labelDataQuery.isLoading,
    isLabelDataError: labelDataQuery.isError,
    labelDataError: labelDataQuery.error,
    fertilizerData: fertilizerDataQuery.data,
    isLoadingFertilizerData: fertilizerDataQuery.isLoading,
    isFertilizerDataError: fertilizerDataQuery.isError,
    fertilizerDataError: fertilizerDataQuery.error,
    labelDataMeta: labelDataMetaQuery.data,
    isLoadingMeta: labelDataMetaQuery.isLoading,
    isLabelDataMetaError: labelDataMetaQuery.isError,
    labelDataMetaError: labelDataMetaQuery.error,
    fertilizerDataMeta: fertilizerDataMetaQuery.data,
    isLoadingFertilizerMeta: fertilizerDataMetaQuery.isLoading,
    isFertilizerDataMetaError: fertilizerDataMetaQuery.isError,
    fertilizerDataMetaError: fertilizerDataMetaQuery.error,
  }
}
