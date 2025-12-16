import { Organization } from "@/types/types";
import { updateOrganizations } from "../modelTransformation";
import { normalizePhoneNumber } from "../phoneNumbers";

describe("updateOrganizations", () => {
  const baseOrg = (
    id: string | null,
    name: string,
    address: string,
    website: string,
    phoneNumber: string,
    mainContact: boolean,
  ): Organization => ({
    id,
    name: { value: name, verified: false },
    address: { value: address, verified: false },
    website: { value: website, verified: false },
    phoneNumber: { value: phoneNumber, verified: false },
    mainContact,
  });

  const companyInc = baseOrg(
    null,
    "Company Inc.",
    "123 Street",
    "http://example.com",
    "123-456-7890",
    true,
  );
  const mfgCorp = baseOrg(
    null,
    "Mfg Corp.",
    "456 Road",
    "http://mfg.com",
    "987-654-3210",
    false,
  );
  const unknownCo = baseOrg(
    null,
    "Unknown Co.",
    "789 Unknown",
    "http://unknown.com",
    "555-555-5555",
    true,
  );

  const updatedCompanyInc = baseOrg(
    "ORG123",
    "Company Inc.",
    "123 Street",
    "http://example.com",
    "123-456-7890",
    true,
  );
  const updatedMfgCorp = baseOrg(
    "ORG456",
    "Mfg Corp.",
    "456 Road",
    "http://mfg.com",
    "987-654-3210",
    false,
  );

  it("should update organization IDs when a match is found", () => {
    const existingOrganizations = [companyInc, mfgCorp];
    const updatedOrganizations = [updatedCompanyInc, updatedMfgCorp];

    const result = updateOrganizations(
      existingOrganizations,
      updatedOrganizations,
    );

    expect(result).toEqual([
      { ...companyInc, id: "ORG123" },
      { ...mfgCorp, id: "ORG456" },
    ]);
  });

  it("should not change IDs if no match is found", () => {
    const existingOrganizations = [unknownCo];
    const updatedOrganizations = [updatedCompanyInc];

    const result = updateOrganizations(
      existingOrganizations,
      updatedOrganizations,
    );

    expect(result).toEqual([unknownCo]);
  });

  it("should use each updated ID only once", () => {
    const existingOrganizations = [companyInc, companyInc];
    const updatedOrganizations = [
      updatedCompanyInc,
      { ...updatedCompanyInc, id: "ORG124" },
    ];

    const result = updateOrganizations(
      existingOrganizations,
      updatedOrganizations,
    );

    expect(result).toEqual([
      { ...companyInc, id: "ORG123" },
      { ...companyInc, id: "ORG124" },
    ]);
  });

  it("should not assign an ID if all matching IDs have been used", () => {
    const existingOrganizations = [companyInc, companyInc, companyInc];
    const updatedOrganizations = [
      updatedCompanyInc,
      { ...updatedCompanyInc, id: "ORG124" },
    ];

    const result = updateOrganizations(
      existingOrganizations,
      updatedOrganizations,
    );

    expect(result).toEqual([
      { ...companyInc, id: "ORG123" },
      { ...companyInc, id: "ORG124" },
      companyInc,
    ]);
  });

  it("should correctly update IDs even when order is different", () => {
    const existingOrganizations = [mfgCorp, companyInc];
    const updatedOrganizations = [updatedCompanyInc, updatedMfgCorp];

    const result = updateOrganizations(
      existingOrganizations,
      updatedOrganizations,
    );

    expect(result).toEqual([
      { ...mfgCorp, id: "ORG456" },
      { ...companyInc, id: "ORG123" },
    ]);
  });
});

describe("normalizePhoneNumber", () => {
  it("should return E.164 formatted number if parsing succeeds", () => {
    expect(normalizePhoneNumber("+1 234-567-8900", "US")).toBe("+12345678900");
  });

  it("should return the original input if parsing fails", () => {
    expect(normalizePhoneNumber("invalid number", "US")).toBe("invalid number");
  });

  it("should default to 'US' if no country code is provided", () => {
    expect(normalizePhoneNumber("123-456-7890")).toBe("+11234567890");
  });
});
