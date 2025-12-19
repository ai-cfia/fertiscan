import { handleApiError } from "@/utils/server/apiErrors";
import {
  createErrorResponse,
  MISSING_AUTH_RESPONSE,
} from "@/utils/server/apiResponses";
import { filesApi } from "@/utils/server/backend";
import { validate } from "uuid";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pictureSetId: string; pictureId: string }> },
) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return MISSING_AUTH_RESPONSE;
  }

  const { pictureSetId, pictureId } = await params;
  if (!validate(pictureSetId)) {
    return createErrorResponse("Invalid pictureSetId", 400);
  }
  if (!validate(pictureId)) {
    return createErrorResponse("Invalid pictureId", 400);
  }

  console.debug(
    "[get pictures] pictureSetId:",
    pictureSetId,
    "pictureId:",
    pictureId,
  );

  return filesApi
    .getFileFilesFolderIdFileIdGet(pictureSetId, pictureId, {
      headers: { Authorization: authHeader },
      responseType: "arraybuffer",
    })
    .then((r) => {
      const file = r.data;
      console.debug("[get pictures] received File object:", typeof file);
      return new Response(file);
    })
    .catch((error) => {
      return handleApiError(error);
    });
}
