import Cookies from "js-cookie";
import { VERIFIED_LABEL_DATA, VERIFIED_LABEL_DATA_WITH_ID } from "../constants";
import {
  getAuthHeader,
  getLabelDataFromCookies,
  setLabelDataInCookies,
} from "../cookies";

jest.mock("js-cookie");

describe("getAuthHeader", () => {
  it("should return the correct Authorization header", () => {
    (Cookies.get as jest.Mock).mockReturnValue(btoa("testUser:password"));
    const authHeader = getAuthHeader();
    expect(authHeader).toBe("Basic dGVzdFVzZXI6cGFzc3dvcmQ6");
  });

  it("should return empty Authorization header if token is missing", () => {
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    const authHeader = getAuthHeader();
    expect(authHeader).toBe("Basic Og==");
  });
});

describe("setLabelDataInCookies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should set label data with an inspectionId", () => {
    setLabelDataInCookies(VERIFIED_LABEL_DATA_WITH_ID);
    expect(Cookies.set).toHaveBeenCalledWith(
      "labelData_1234",
      JSON.stringify(VERIFIED_LABEL_DATA_WITH_ID),
      { expires: 1 },
    );
  });

  it("should set label data with default name if no inspectionId", () => {
    setLabelDataInCookies(VERIFIED_LABEL_DATA);
    expect(Cookies.set).toHaveBeenCalledWith(
      "labelData_no_id",
      JSON.stringify(VERIFIED_LABEL_DATA),
      { expires: 1 },
    );
  });
});

describe("getLabelDataFromCookies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should retrieve label data if cookie exists", () => {
    (Cookies.get as jest.Mock).mockReturnValue(
      JSON.stringify(VERIFIED_LABEL_DATA_WITH_ID),
    );
    const result = getLabelDataFromCookies("1234");
    expect(result).toEqual(VERIFIED_LABEL_DATA_WITH_ID);
  });

  it("should return null if cookie does not exist", () => {
    (Cookies.get as jest.Mock).mockReturnValue(undefined);
    const result = getLabelDataFromCookies("1234");
    expect(result).toBeNull();
  });

  it("should retrieve label data with default name if no inspectionId", () => {
    (Cookies.get as jest.Mock).mockReturnValue(
      JSON.stringify(VERIFIED_LABEL_DATA),
    );
    const result = getLabelDataFromCookies(null);
    expect(result).toEqual(VERIFIED_LABEL_DATA);
  });

  it("should retrieve label data with default name if inspectionId is an empty string", () => {
    (Cookies.get as jest.Mock).mockReturnValue(
      JSON.stringify(VERIFIED_LABEL_DATA),
    );
    const result = getLabelDataFromCookies("");
    expect(result).toEqual(VERIFIED_LABEL_DATA);
  });

  it("should retrieve label data with default name if inspectionId is undefined", () => {
    (Cookies.get as jest.Mock).mockReturnValue(
      JSON.stringify(VERIFIED_LABEL_DATA),
    );
    const result = getLabelDataFromCookies(undefined);
    expect(result).toEqual(VERIFIED_LABEL_DATA);
  });
});
