import { LabelData, RegistrationType } from "@/types/types";

export const VERIFIED_LABEL_DATA: LabelData = {
  organizations: [
    {
      name: { value: "AgriGrow Fertilizers Inc.", verified: true },
      address: { value: "123 Greenfield Ave, Springfield", verified: true },
      website: { value: "www.agrigrow.com", verified: true },
      phoneNumber: { value: "+1-800-555-0199", verified: true },
      mainContact: true,
    },
    {
      name: { value: "GreenHarvest Supplies", verified: true },
      address: { value: "456 Farm Road, Rivertown", verified: true },
      website: { value: "www.greenharvest.com", verified: true },
      phoneNumber: { value: "+1-800-555-0246", verified: true },
      mainContact: false,
    },
  ],
  baseInformation: {
    name: { value: "SuperGrow 20-20-20", verified: true },
    registrationNumbers: {
      values: [
        {
          identifier: "1234567A",
          type: RegistrationType.FERTILIZER,
        },
      ],
      verified: true,
    },
    lotNumber: { value: "LOT-4567", verified: true },
    npk: { value: "20-20-20", verified: true },
    weight: {
      verified: true,
      quantities: [
        { value: "25", unit: "kg" },
        { value: "55.12", unit: "lb" },
      ],
    },
    density: {
      verified: true,
      quantities: [{ value: "1.2", unit: "g/cm³" }],
    },
    volume: {
      verified: true,
      quantities: [{ value: "20", unit: "L" }],
    },
  },
  cautions: [
    {
      en: "Keep out of reach of children.",
      fr: "Garder hors de portée des enfants.",
      verified: true,
    },
  ],
  instructions: [
    {
      en: "Dilute 20g in 1L of water before use.",
      fr: "Diluer 20g dans 1L d'eau avant utilisation.",
      verified: true,
    },
  ],
  guaranteedAnalysis: {
    titleEn: { value: "Guaranteed Analysis", verified: true },
    titleFr: { value: "Analyse Garantie", verified: true },
    isMinimal: { value: true, verified: true },
    nutrients: [
      {
        en: "Nitrogen (N)",
        fr: "Azote (N)",
        value: "20",
        unit: "%",
        verified: true,
      },
      {
        en: "Phosphorus (P)",
        fr: "Phosphore (P)",
        value: "20",
        unit: "%",
        verified: true,
      },
      {
        en: "Potassium (K)",
        fr: "Potassium (K)",
        value: "20",
        unit: "%",
        verified: true,
      },
    ],
  },
  ingredients: {
    recordKeeping: { value: false, verified: true },
    nutrients: [
      { en: "Urea", fr: "Urée", value: "10", unit: "%", verified: true },
      {
        en: "Ammonium phosphate",
        fr: "Phosphate d'ammonium",
        value: "30",
        unit: "%",
        verified: true,
      },
      {
        en: "Potassium chloride",
        fr: "Chlorure de potassium",
        value: "60",
        unit: "%",
        verified: true,
      },
    ],
  },
  confirmed: false,
  comment: "Compliant with regulations.",
};

export const VERIFIED_LABEL_DATA_WITH_ID = {
  ...VERIFIED_LABEL_DATA,
  inspectionId: "1234",
};

export const CONFIRMED_LABEL_DATA = {
  ...VERIFIED_LABEL_DATA_WITH_ID,
  confirmed: true,
};
