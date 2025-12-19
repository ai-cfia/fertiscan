import { LabelData, VerifiedField } from "@/types/types";

export const checkFieldRecord = (
  record?: Record<string, VerifiedField>,
  verified: boolean = true,
): boolean => {
  return record
    ? Object.values(record).every((field) => field.verified === verified)
    : false;
};

export const checkFieldArray = (
  fields: VerifiedField[],
  verified: boolean = true,
): boolean => {
  return fields.every((field) => field.verified === verified);
};

export const isAllVerified = (labelData: LabelData): boolean => {
  const isOrganizationsVerified = labelData.organizations.every(
    ({ name, address, website, phoneNumber }) =>
      checkFieldRecord({ name, address, website, phoneNumber }),
  );
  const isBaseInformationVerified = checkFieldRecord(labelData.baseInformation);
  const isCautionsVerified = checkFieldArray(labelData.cautions);
  const isInstructionsVerified = checkFieldArray(labelData.instructions);
  const isGuaranteedAnalysisVerified =
    checkFieldRecord({
      titleEn: labelData.guaranteedAnalysis.titleEn,
      titleFr: labelData.guaranteedAnalysis.titleFr,
      isMinimal: labelData.guaranteedAnalysis.isMinimal,
    }) && checkFieldArray(labelData.guaranteedAnalysis.nutrients);
  const isIngredientsVerified =
    checkFieldRecord({ recordKeeping: labelData.ingredients.recordKeeping }) &&
    checkFieldArray(labelData.ingredients.nutrients);
  return (
    isOrganizationsVerified &&
    isBaseInformationVerified &&
    isCautionsVerified &&
    isInstructionsVerified &&
    isGuaranteedAnalysisVerified &&
    isIngredientsVerified
  );
};
