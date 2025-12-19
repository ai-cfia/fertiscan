import { handleApiError } from "@/utils/server/apiErrors";
import { MISSING_AUTH_RESPONSE } from "@/utils/server/apiResponses";
import { usersApi } from "@/utils/server/backend";

export async function POST(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return MISSING_AUTH_RESPONSE;
  }

  return usersApi
    .loginLoginPost({ headers: { Authorization: authHeader } })
    .then((response) => {
      return Response.json(response.data);
    })
    .catch((error) => {
      return handleApiError(error);
    });
}
