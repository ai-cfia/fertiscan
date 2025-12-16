import { LabelData } from "@/types/types";
import Cookies from "js-cookie";

const COOKIE_PREFIX = "labelData_";

const getCookieName = (inspectionId?: string | null) =>
  COOKIE_PREFIX + (inspectionId || "no_id");

export const getAuthHeader = () => {
  return "Basic " + btoa(`${atob(Cookies.get("token") ?? "")}:`);
};

export const setLabelDataInCookies = (labelData: LabelData) => {
  const cookieName = getCookieName(labelData.inspectionId);

  console.debug(`[Cookies] Setting label data for:`, cookieName);

  Cookies.set(cookieName, JSON.stringify(labelData), { expires: 1 });
};

export const getLabelDataFromCookies = (
  inspectionId: string | null | undefined,
): LabelData | null => {
  const cookieName = getCookieName(inspectionId);

  const data = Cookies.get(cookieName);
  if (!data) return null;

  console.debug(`[Cookies] Retrieved label data for:`, cookieName);
  return JSON.parse(data);
};
