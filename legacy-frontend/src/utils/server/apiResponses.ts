export const createErrorResponse = (msg: string, status: number) => {
  if (status < 400) {
    throw new Error("Status code must be 400 or higher");
  }
  return new Response(JSON.stringify({ error: msg }), { status });
};

export const MISSING_AUTH_RESPONSE = createErrorResponse(
  "Missing Authorization header",
  401,
);

export const INVALID_ID_RESPONSE = createErrorResponse("Invalid id", 400);
