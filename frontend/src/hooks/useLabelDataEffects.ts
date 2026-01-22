import { useQueryClient } from "@tanstack/react-query"
import { AxiosError } from "axios"
import { useEffect, useState } from "react"

// ============================== Label Data Effects ==============================
export function useLabelDataEffects(
  labelId: string,
  isFertilizer: boolean,
  isLoadingData: boolean,
  isLabelDataError: boolean,
  labelDataError: unknown,
  isLoadingFertilizerData: boolean,
  isFertilizerDataError: boolean,
  fertilizerDataError: unknown,
  isLabelDataMetaError: boolean,
  labelDataMetaError: unknown,
  isFertilizerDataMetaError: boolean,
  fertilizerDataMetaError: unknown,
  labelData: any,
  fertilizerData: any,
  createLabelDataMutation: any,
  createFertilizerDataMutation: any,
) {
  const queryClient = useQueryClient()
  const [loadError, setLoadError] = useState<Error | null>(null)
  useEffect(() => {
    if (
      !isLoadingData &&
      isLabelDataError &&
      labelDataError instanceof AxiosError &&
      labelDataError.response?.status === 404 &&
      !createLabelDataMutation.isPending &&
      !createLabelDataMutation.isError
    ) {
      createLabelDataMutation.mutate()
    }
  }, [isLoadingData, isLabelDataError, labelDataError, createLabelDataMutation])
  useEffect(() => {
    if (
      isFertilizer &&
      !isLoadingFertilizerData &&
      isFertilizerDataError &&
      fertilizerDataError instanceof AxiosError &&
      fertilizerDataError.response?.status === 404 &&
      !createFertilizerDataMutation.isPending &&
      !createFertilizerDataMutation.isError
    ) {
      createFertilizerDataMutation.mutate()
    }
  }, [
    isFertilizer,
    isLoadingFertilizerData,
    isFertilizerDataError,
    fertilizerDataError,
    createFertilizerDataMutation,
  ])
  useEffect(() => {
    if (
      isLabelDataMetaError &&
      labelDataMetaError instanceof AxiosError &&
      labelDataMetaError.response?.status !== 404
    ) {
      setLoadError(labelDataMetaError)
    }
  }, [isLabelDataMetaError, labelDataMetaError])
  useEffect(() => {
    if (
      isFertilizer &&
      isFertilizerDataMetaError &&
      fertilizerDataMetaError instanceof AxiosError &&
      fertilizerDataMetaError.response?.status !== 404
    ) {
      setLoadError(fertilizerDataMetaError)
    }
  }, [isFertilizer, isFertilizerDataMetaError, fertilizerDataMetaError])
  useEffect(() => {
    if (
      isLabelDataMetaError &&
      labelDataMetaError instanceof AxiosError &&
      labelDataMetaError.response?.status === 404 &&
      labelData
    ) {
      queryClient.invalidateQueries({ queryKey: ["labelDataMeta", labelId] })
    }
  }, [
    isLabelDataMetaError,
    labelDataMetaError,
    labelData,
    queryClient,
    labelId,
  ])
  useEffect(() => {
    if (
      isFertilizer &&
      isFertilizerDataMetaError &&
      fertilizerDataMetaError instanceof AxiosError &&
      fertilizerDataMetaError.response?.status === 404 &&
      fertilizerData
    ) {
      queryClient.invalidateQueries({
        queryKey: ["fertilizerLabelDataMeta", labelId],
      })
    }
  }, [
    isFertilizer,
    isFertilizerDataMetaError,
    fertilizerDataMetaError,
    fertilizerData,
    queryClient,
    labelId,
  ])
  useEffect(() => {
    if (
      isLabelDataError &&
      labelDataError instanceof AxiosError &&
      labelDataError.response?.status !== 404
    ) {
      setLoadError(labelDataError)
    }
  }, [isLabelDataError, labelDataError])
  useEffect(() => {
    if (
      isFertilizer &&
      isFertilizerDataError &&
      fertilizerDataError instanceof AxiosError &&
      fertilizerDataError.response?.status !== 404
    ) {
      setLoadError(fertilizerDataError)
    }
  }, [isFertilizer, isFertilizerDataError, fertilizerDataError])
  return { loadError, setLoadError }
}
