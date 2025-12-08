import { AlertColor } from "@mui/material/Alert";
import { AlertPropsColorOverrides } from "@mui/material/Alert/Alert";
import { OverridableStringUnion } from "@mui/types";

/**
 * Represents the state of a dropzone component.
 */
interface DropzoneState {
  /**
   * Indicates whether the dropzone is visible.
   */
  visible: boolean;

  /**
   * The URL of the image associated with the dropzone, or null if no image is present.
   */
  imageUrl: string | null;

  /**
   * The percentage of the dropzone that is filled, if applicable.
   * This property is optional.
   */
  fillPercentage?: number;
}

/**
 * Represents an event that occurs when an image has finished loading.
 * Extends the React SyntheticEvent specifically for HTMLImageElement.
 *
 * @interface ImageLoadEvent
 * @extends {React.SyntheticEvent<HTMLImageElement>}
 * @property {HTMLImageElement} target - The target element of the event, which is an HTMLImageElement.
 */
interface ImageLoadEvent extends React.SyntheticEvent<HTMLImageElement> {
  target: HTMLImageElement;
}

/**
 * Represents the dimensions of a parent element.
 *
 * @property {number} width - The width of the parent element.
 * @property {number} height - The height of the parent element.
 */
interface ParentDimensions {
  width: number;
  height: number;
}

export type { DropzoneState, ImageLoadEvent, ParentDimensions };

// Alert
export type AlertSeverity = OverridableStringUnion<
  AlertColor,
  AlertPropsColorOverrides
>;

export interface Alert {
  message: string;
  type: AlertSeverity;
}

export type VerifiedField = {
  verified: boolean;
};

export type VerifiedTextField = VerifiedField & {
  value: string;
};

const DEFAULT_TEXT_FIELD: VerifiedTextField = {
  value: "",
  verified: false,
};

export type VerifiedBooleanField = VerifiedField & {
  value: boolean;
};

export const DEFAULT_BOOLEAN_FIELD: VerifiedBooleanField = {
  value: false,
  verified: false,
};

// Organizations
export type Organization = {
  name: VerifiedTextField;
  address: VerifiedTextField;
  website: VerifiedTextField;
  phoneNumber: VerifiedTextField;
  mainContact: boolean;
  id?: string | null;
};

export const DEFAULT_ORGANIZATION: Organization = {
  name: DEFAULT_TEXT_FIELD,
  address: DEFAULT_TEXT_FIELD,
  website: DEFAULT_TEXT_FIELD,
  phoneNumber: DEFAULT_TEXT_FIELD,
  mainContact: false,
};

// Quantity
export type Quantity = {
  value: string;
  unit: string;
};

export const DEFAULT_QUANTITY = { value: "", unit: "" };

export type VerifiedQuantities = VerifiedField & {
  quantities: Quantity[];
};

export const UNITS = {
  weight: ["kg", "g", "lb", "tonne"],
  volume: ["L", "mL", "gal", "ft³"],
  density: ["lb/ft³", "g/cm³", "kg/m³", "lb/gal"],
  guaranteedAnalysis: ["%", "ppm"],
  ingredients: ["%", "ppm"],
};

export const DEFAULT_QUANTITY_FIELD: VerifiedQuantities = {
  verified: false,
  quantities: [DEFAULT_QUANTITY],
};

// reg numbers
export enum RegistrationType {
  FERTILIZER = "fertilizer_product",
  INGREDIENT = "ingredient_component",
}
export type RegistrationNumber = {
  identifier: string;
  type: RegistrationType;
};
export const DEFAULT_REGISTRATION_NUMBER: RegistrationNumber = {
  identifier: "",
  type: RegistrationType.FERTILIZER,
};
export type RegistrationNumbers = VerifiedField & {
  values: RegistrationNumber[];
};
export const DEFAULT_REGISTRATION_NUMBERS: RegistrationNumbers = {
  verified: false,
  values: [DEFAULT_REGISTRATION_NUMBER],
};

// Base Information
export type BaseInformation = {
  name: VerifiedTextField;
  registrationNumbers: RegistrationNumbers;
  lotNumber: VerifiedTextField;
  npk: VerifiedTextField;
  weight: VerifiedQuantities;
  density: VerifiedQuantities;
  volume: VerifiedQuantities;
};

export const DEFAULT_BASE_INFORMATION: BaseInformation = {
  name: DEFAULT_TEXT_FIELD,
  registrationNumbers: DEFAULT_REGISTRATION_NUMBERS,
  lotNumber: DEFAULT_TEXT_FIELD,
  npk: DEFAULT_TEXT_FIELD,
  weight: DEFAULT_QUANTITY_FIELD,
  density: DEFAULT_QUANTITY_FIELD,
  volume: DEFAULT_QUANTITY_FIELD,
};

export type Translation = {
  en: string;
  fr: string;
};

export type BilingualField = VerifiedField & Translation & Partial<Quantity>;

export const DEFAULT_BILINGUAL_FIELD: BilingualField = {
  en: "",
  fr: "",
  verified: false,
};

export const FULL_BILINGUAL_FIELD: BilingualField = {
  en: "",
  fr: "",
  value: "",
  unit: "",
  verified: false,
};

export type GuaranteedAnalysis = {
  titleEn: VerifiedTextField;
  titleFr: VerifiedTextField;
  isMinimal: VerifiedBooleanField;
  nutrients: BilingualField[];
};

export const DEFAULT_GUARANTEED_ANALYSIS: GuaranteedAnalysis = {
  titleEn: DEFAULT_TEXT_FIELD,
  titleFr: DEFAULT_TEXT_FIELD,
  isMinimal: DEFAULT_BOOLEAN_FIELD,
  nutrients: [FULL_BILINGUAL_FIELD],
};

export type Ingredients = {
  recordKeeping: VerifiedBooleanField;
  nutrients: BilingualField[];
};

export const DEFAULT_INGREDIENTS: Ingredients = {
  recordKeeping: DEFAULT_BOOLEAN_FIELD,
  nutrients: [FULL_BILINGUAL_FIELD],
};

// LabelData
export type LabelData = {
  organizations: Organization[];
  baseInformation: BaseInformation;
  cautions: BilingualField[];
  instructions: BilingualField[];
  guaranteedAnalysis: GuaranteedAnalysis;
  ingredients: Ingredients;
  confirmed: boolean;
  comment?: string;
  inspectionId?: string;
  pictureSetId?: string;
};

export const DEFAULT_LABEL_DATA: LabelData = {
  organizations: [DEFAULT_ORGANIZATION],
  baseInformation: DEFAULT_BASE_INFORMATION,
  cautions: [DEFAULT_BILINGUAL_FIELD],
  instructions: [DEFAULT_BILINGUAL_FIELD],
  guaranteedAnalysis: DEFAULT_GUARANTEED_ANALYSIS,
  ingredients: DEFAULT_INGREDIENTS,
  confirmed: false,
};

// Form
export interface FormComponentProps {
  loading?: boolean;
  labelData: LabelData;
  setLabelData: React.Dispatch<React.SetStateAction<LabelData>>;
}
