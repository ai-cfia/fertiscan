import { processFetchedBlob } from "@/classes/File";
import { getAuthHeader } from "@/utils/client/cookies";
import axios from "axios";
import { FolderResponse } from "../server/backend";

export function fetchImages(
  pictureSetId: string,
  signal?: AbortSignal,
): Promise<File[]> {
  if (!pictureSetId) return Promise.resolve([]);

  return axios
    .get<FolderResponse>(`/api-next/pictures/${pictureSetId}`, {
      headers: { Authorization: getAuthHeader() },
      signal,
    })
    .then((res) => {
      const folderDetails = res.data;
      const pictureIds = folderDetails.file_ids || [];

      return Promise.all(
        pictureIds.map((pictureId) =>
          axios
            .get(`/api-next/pictures/${pictureSetId}/${pictureId}`, {
              headers: { Authorization: getAuthHeader() },
              responseType: "blob",
              signal,
            })
            .then((res) => processFetchedBlob(res.data, pictureId)),
        ),
      );
    })
    .then((files) => files.filter((file): file is File => file !== null));
}
