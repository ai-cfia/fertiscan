import {
  BilingualField,
  DEFAULT_ORGANIZATION,
  DEFAULT_QUANTITY,
  DEFAULT_REGISTRATION_NUMBER,
  LabelData,
  Quantity,
  RegistrationType,
} from "@/types/types";
import {
  LabelData as BackendLabelData,
  Quantity as BackendQuantity,
  InspectionCreate,
  InspectionResponse,
  InspectionUpdate,
  Nutrient,
  Value,
} from "./backend";

export function quantity(val?: BackendQuantity | Value | null): Quantity {
  return { value: String(val?.value ?? ""), unit: val?.unit ?? "" };
}

export function verifiedTranslations(
  enList?: (string | null)[] | null,
  frList?: (string | null)[] | null,
): BilingualField[] {
  return (enList ?? []).map((en, i) => ({
    en: en ?? "",
    fr: frList?.[i] ?? "",
    verified: false,
  }));
}

export function mapVerifiedNutrientPairs(
  enList?: Nutrient[] | null,
  frList?: Nutrient[] | null,
): BilingualField[] {
  return (enList ?? []).map((en, i) => ({
    en: en.nutrient ?? "",
    fr: frList?.[i]?.nutrient ?? "",
    value: String(en.value ?? ""),
    unit: en.unit ?? "",
    verified: false,
  }));
}

export function mapVerifiedInspectionValues(
  enList?: Value[] | null,
  frList?: Value[] | null,
  verified?: boolean | null,
): BilingualField[] {
  return (enList ?? []).map((en, i) => ({
    en: en?.name ?? "",
    fr: frList?.[i]?.name ?? "",
    value: String(en?.value ?? ""),
    unit: en?.unit ?? "",
    verified: verified ?? false,
  }));
}

export function mapBackendLabelDataToLabelData(
  data: BackendLabelData,
): LabelData {
  return {
    organizations: data.organizations?.length
      ? data.organizations?.map((org) => ({
          name: { value: org.name ?? "", verified: false },
          address: { value: org.address ?? "", verified: false },
          website: { value: org.website ?? "", verified: false },
          phoneNumber: { value: org.phone_number ?? "", verified: false },
          mainContact: false,
        }))
      : [DEFAULT_ORGANIZATION],
    baseInformation: {
      name: { value: data.fertiliser_name ?? "", verified: false },
      registrationNumbers: {
        verified: false,
        values: data.registration_number?.length
          ? data.registration_number.map((reg) => ({
              identifier: reg.identifier ?? "",
              type:
                (reg.type as RegistrationType) ?? RegistrationType.FERTILIZER,
            }))
          : [DEFAULT_REGISTRATION_NUMBER],
      },
      lotNumber: { value: data.lot_number ?? "", verified: false },
      npk: { value: data.npk ?? "", verified: false },
      weight: {
        verified: false,
        quantities: data.weight?.length
          ? (data.weight ?? []).map(quantity)
          : [DEFAULT_QUANTITY],
      },
      density: { verified: false, quantities: [quantity(data.density)] },
      volume: { verified: false, quantities: [quantity(data.volume)] },
    },
    cautions: verifiedTranslations(data.cautions_en, data.cautions_fr),
    instructions: verifiedTranslations(
      data.instructions_en,
      data.instructions_fr,
    ),
    guaranteedAnalysis: {
      titleEn: {
        value: data.guaranteed_analysis_en?.title ?? "",
        verified: false,
      },
      titleFr: {
        value: data.guaranteed_analysis_fr?.title ?? "",
        verified: false,
      },
      isMinimal: {
        value: !!data.guaranteed_analysis_en?.is_minimal,
        verified: false,
      },
      nutrients: mapVerifiedNutrientPairs(
        data.guaranteed_analysis_en?.nutrients,
        data.guaranteed_analysis_fr?.nutrients,
      ),
    },
    ingredients: {
      recordKeeping: { value: false, verified: false },
      nutrients: mapVerifiedNutrientPairs(
        data.ingredients_en,
        data.ingredients_fr,
      ),
    },
    confirmed: false,
    pictureSetId: data.picture_set_id || undefined,
  };
}

export function mapInspectionToLabelData(
  inspection: InspectionResponse,
): LabelData {
  const v = inspection.verified || false;
  return {
    organizations: inspection.organizations?.length
      ? (inspection.organizations ?? []).map((org) => ({
          id: org.id,
          name: { value: org.name ?? "", verified: v },
          address: { value: org.address ?? "", verified: v },
          website: { value: org.website ?? "", verified: v },
          phoneNumber: { value: org.phone_number ?? "", verified: v },
          mainContact: org.is_main_contact ?? false,
        }))
      : [DEFAULT_ORGANIZATION],
    baseInformation: {
      name: { value: inspection.product.name ?? "", verified: v },
      registrationNumbers: {
        verified: v,
        values: inspection.product.registration_numbers?.length
          ? inspection.product.registration_numbers.map((reg) => ({
              identifier: reg.registration_number ?? "",
              type: reg.is_an_ingredient
                ? RegistrationType.INGREDIENT
                : RegistrationType.FERTILIZER,
            }))
          : [DEFAULT_REGISTRATION_NUMBER],
      },
      lotNumber: { value: inspection.product.lot_number ?? "", verified: v },
      npk: { value: inspection.product.npk ?? "", verified: v },
      weight: {
        verified: v,
        quantities: inspection.product.metrics?.weight?.length
          ? inspection.product.metrics.weight.map(quantity)
          : [DEFAULT_QUANTITY],
      },
      density: {
        verified: v,
        quantities: [quantity(inspection.product.metrics?.density)],
      },
      volume: {
        verified: v,
        quantities: [quantity(inspection.product.metrics?.volume)],
      },
    },
    cautions: (inspection.cautions.en ?? []).map((en, i) => ({
      en: en ?? "",
      fr: inspection.cautions.fr?.[i] ?? "",
      verified: v,
    })),
    instructions: (inspection.instructions.en ?? []).map((en, i) => ({
      en: en ?? "",
      fr: inspection.instructions.fr?.[i] ?? "",
      verified: v,
    })),
    guaranteedAnalysis: {
      titleEn: {
        value: inspection.guaranteed_analysis?.title?.en ?? "",
        verified: v,
      },
      titleFr: {
        value: inspection.guaranteed_analysis?.title?.fr ?? "",
        verified: v,
      },
      isMinimal: {
        value: !!inspection.guaranteed_analysis?.is_minimal,
        verified: v,
      },
      nutrients: mapVerifiedInspectionValues(
        inspection.guaranteed_analysis?.en,
        inspection.guaranteed_analysis?.fr,
        v,
      ),
    },
    ingredients: {
      recordKeeping: {
        value: !!inspection.product?.record_keeping,
        verified: v,
      },
      nutrients: mapVerifiedInspectionValues(
        inspection.ingredients?.en,
        inspection.ingredients?.fr,
        v,
      ),
    },
    confirmed: v,
    inspectionId: inspection.inspection_id,
    comment: inspection.inspection_comment ?? "",
    pictureSetId: inspection.picture_set_id,
  };
}

export function mapLabelDataToInspectionCreate(
  labelData: LabelData,
): InspectionCreate {
  return {
    organizations: (labelData.organizations || []).map((org) => ({
      name: org.name?.value,
      address: org.address?.value,
      website: org.website?.value,
      phone_number: org.phoneNumber?.value || null,
    })),
    fertiliser_name: labelData.baseInformation.name.value,
    registration_number: labelData.baseInformation.registrationNumbers.values
      .filter((r) => r.identifier)
      .map((reg) => ({
        identifier: reg.identifier,
        type: reg.type ?? null,
      })),
    lot_number: labelData.baseInformation.lotNumber.value,
    weight:
      labelData.baseInformation.weight.quantities?.map((q) => ({
        value: Number(q.value) || null,
        unit: q.unit || null,
      })) || [],
    density: {
      value:
        Number(labelData.baseInformation.density.quantities?.[0]?.value) ||
        null,
      unit: labelData.baseInformation.density.quantities?.[0]?.unit || null,
    },
    volume: {
      value:
        Number(labelData.baseInformation.volume.quantities?.[0]?.value) || null,
      unit: labelData.baseInformation.volume.quantities?.[0]?.unit || null,
    },
    npk: labelData.baseInformation.npk.value || undefined,
    guaranteed_analysis_en: {
      title: labelData.guaranteedAnalysis.titleEn.value,
      is_minimal: labelData.guaranteedAnalysis.isMinimal.value,
      nutrients: labelData.guaranteedAnalysis.nutrients.map((n) => ({
        nutrient: n.en,
        value: Number(n.value),
        unit: n.unit,
      })),
    },
    guaranteed_analysis_fr: {
      title: labelData.guaranteedAnalysis.titleFr.value,
      is_minimal: labelData.guaranteedAnalysis.isMinimal.value,
      nutrients: labelData.guaranteedAnalysis.nutrients.map((n) => ({
        nutrient: n.fr,
        value: Number(n.value),
        unit: n.unit,
      })),
    },
    cautions_en: labelData.cautions.map((c) => c.en),
    cautions_fr: labelData.cautions.map((c) => c.fr),
    instructions_en: labelData.instructions.map((i) => i.en),
    instructions_fr: labelData.instructions.map((i) => i.fr),
    ingredients_en: labelData.ingredients.nutrients.map((i) => ({
      nutrient: i.en,
      value: Number(i.value),
      unit: i.unit,
    })),
    ingredients_fr: labelData.ingredients.nutrients.map((i) => ({
      nutrient: i.fr,
      value: Number(i.value),
      unit: i.unit,
    })),
    picture_set_id: labelData.pictureSetId || "",
  };
}

export function mapLabelDataToInspectionUpdate(
  labelData: LabelData,
): InspectionUpdate {
  const recordKeeping = labelData.ingredients.recordKeeping.value;
  return {
    inspection_comment: labelData.comment,
    verified: labelData.confirmed,
    organizations: labelData.organizations?.map((org) => ({
      id: org.id,
      name: org.name?.value,
      address: org.address?.value,
      website: org.website?.value,
      phone_number: org.phoneNumber?.value || null,
      is_main_contact: org.mainContact,
    })),
    product: {
      name: labelData.baseInformation.name.value,
      registration_numbers: labelData.baseInformation.registrationNumbers.values
        .filter((reg) => reg.identifier)
        .map((reg) => ({
          registration_number: reg.identifier,
          is_an_ingredient: reg.type === RegistrationType.INGREDIENT,
        })),
      lot_number: labelData.baseInformation.lotNumber.value,
      npk: labelData.baseInformation.npk.value || null,
      metrics: {
        weight: labelData.baseInformation.weight.quantities.map((q) => ({
          value: Number(q.value),
          unit: q.unit,
        })),
        density: {
          value:
            Number(labelData.baseInformation.density.quantities?.[0]?.value) ||
            null,
          unit: labelData.baseInformation.density.quantities?.[0]?.unit || null,
        },
        volume: {
          value:
            Number(labelData.baseInformation.volume.quantities?.[0]?.value) ||
            null,
          unit: labelData.baseInformation.volume.quantities?.[0]?.unit || null,
        },
      },
      record_keeping: recordKeeping,
    },
    cautions: {
      en: labelData.cautions.map((c) => c.en),
      fr: labelData.cautions.map((c) => c.fr),
    },
    instructions: {
      en: labelData.instructions.map((i) => i.en),
      fr: labelData.instructions.map((i) => i.fr),
    },
    guaranteed_analysis: {
      title: {
        en: labelData.guaranteedAnalysis.titleEn.value,
        fr: labelData.guaranteedAnalysis.titleFr.value,
      },
      is_minimal: labelData.guaranteedAnalysis.isMinimal.value,
      en: labelData.guaranteedAnalysis.nutrients.map((n) => ({
        name: n.en,
        value: Number(n.value),
        unit: n.unit,
      })),
      fr: labelData.guaranteedAnalysis.nutrients.map((n) => ({
        name: n.fr,
        value: Number(n.value),
        unit: n.unit,
      })),
    },
    ingredients: {
      en: recordKeeping
        ? []
        : labelData.ingredients.nutrients.map((i) => ({
            name: i.en,
            value: Number(i.value),
            unit: i.unit,
          })),
      fr: recordKeeping
        ? []
        : labelData.ingredients.nutrients.map((i) => ({
            name: i.fr,
            value: Number(i.value),
            unit: i.unit,
          })),
    },
    inspection_id: labelData.inspectionId,
    picture_set_id: labelData.pictureSetId || "",
  };
}
