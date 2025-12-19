import { LabelData, Organization } from "@/types/types";
import { normalizePhoneNumber } from "./phoneNumbers";

export const updateOrganizations = (
  left: Organization[],
  right: Organization[],
): Organization[] => {
  const remainingUpdatedOrgs = [...right];

  return left.map((org) => {
    const matchingIndex = remainingUpdatedOrgs.findIndex((resOrg) => {
      return (
        resOrg.name.value === org.name.value &&
        resOrg.address.value === org.address.value &&
        resOrg.website.value === org.website.value &&
        normalizePhoneNumber(resOrg.phoneNumber.value) ===
          normalizePhoneNumber(org.phoneNumber.value)
      );
    });

    if (matchingIndex !== -1) {
      const matchingOrg = remainingUpdatedOrgs.splice(matchingIndex, 1)[0];
      return { ...org, id: matchingOrg.id };
    }
    return org;
  });
};

export const updateLabelData = (
  left: LabelData,
  right: LabelData,
): LabelData => {
  return {
    ...left,
    inspectionId: right.inspectionId,
    pictureSetId: right.pictureSetId,
    organizations: updateOrganizations(left.organizations, right.organizations),
  };
};
