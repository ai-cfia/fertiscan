import { handleApiError } from "@/utils/server/apiErrors";
import { MISSING_AUTH_RESPONSE } from "@/utils/server/apiResponses";
import { filesApi, pipelineApi } from "@/utils/server/backend";
import { mapBackendLabelDataToLabelData } from "@/utils/server/modelTransformation";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return MISSING_AUTH_RESPONSE;
  }

  const formData = await request.formData();
  console.debug("[post extract-label-data] request body (formdata):", formData);
  const files = formData.getAll("files") as File[];

  return Promise.allSettled([
    pipelineApi.analyzeDocumentAnalyzePost(files, {
      headers: { Authorization: authHeader },
    }),
    filesApi.createFolderFilesPost(files, {
      headers: { Authorization: authHeader },
    }),
  ])
    .then(([analyzeResult, folderResult]) => {
      if (analyzeResult.status === "rejected") {
        throw analyzeResult.reason;
      }

      console.debug(
        "[post extract-label-data] analyze response data:",
        analyzeResult.value.data,
      );

      if (folderResult.status === "fulfilled") {
        console.debug(
          "[post extract-label-data] folder response data:",
          folderResult.value.data,
        );
        analyzeResult.value.data.picture_set_id = folderResult.value.data.id;
      } else {
        console.warn(
          "[post extract-label-data] folder creation failed:",
          folderResult.reason,
        );
      }

      const labelData = mapBackendLabelDataToLabelData(analyzeResult.value.data);
      console.debug("[post extract-label-data] returned labelData:", labelData);
      return Response.json(labelData);
    })
    .catch((error) => {
      return handleApiError(error);
    });
}
