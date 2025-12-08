import { handleApiError } from "@/utils/server/apiErrors";
import {
  INVALID_ID_RESPONSE,
  MISSING_AUTH_RESPONSE,
} from "@/utils/server/apiResponses";
import { filesApi } from "@/utils/server/backend";
import { validate } from "uuid";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pictureSetId: string }> },
) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return MISSING_AUTH_RESPONSE;
  }

  const pictureSetId = (await params).pictureSetId;
  if (!validate(pictureSetId)) {
    return INVALID_ID_RESPONSE;
  }

  console.debug("[get pictures] pictureSetId:", pictureSetId);

  return filesApi
    .getFolderFilesFolderIdGet(pictureSetId, {
      headers: { Authorization: authHeader },
    })
    .then((r) => {
      console.debug("[get pictures] response:", r.data);
      return Response.json(r.data);
    })
    .catch((error) => {
      return handleApiError(error);
    });
}
