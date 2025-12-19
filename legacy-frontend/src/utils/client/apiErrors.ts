import { AxiosError } from "axios";

export const processAxiosError = (error: AxiosError) => {
  if (error.response) {
    console.error("Error response:", error.response.data);
    const responseData = error.response.data as { error: string };
    return responseData.error;
  }

  if (error.request) {
    console.error("Error request:", error.request);
    return error.request;
  }

  console.error("Error message:", error.message);
  return error.message;
};
