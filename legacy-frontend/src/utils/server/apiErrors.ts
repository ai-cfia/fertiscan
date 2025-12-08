import { AxiosError } from "axios";

export function handleApiError(error: AxiosError): Response {
  const { response, request, message } = error;

  if (response) {
    console.error(
      "Response not ok",
      response.status,
      response.statusText,
      "response:",
      JSON.stringify(response.data, null, 2),
    );
    return new Response(
      JSON.stringify({ error: message || response.statusText }),
      {
        status: response.status,
      },
    );
  }

  if (request) {
    console.error("No response was received", "Error request:", request);
    return new Response(JSON.stringify({ error: "No HTTP response" }), {
      status: 500,
    });
  }

  console.error("Unexpected error", "Error message:", message);
  return new Response(JSON.stringify({ error: message }), { status: 500 });
}
