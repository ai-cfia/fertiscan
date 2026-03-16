import type {
  ArrayPath,
  Control,
  FieldValues,
  UseFormReturn,
} from "react-hook-form"
import { useTranslation } from "react-i18next"
import LabelDataNameValueList from "./LabelDataNameValueList"

// ============================== Types ==============================
interface LabelDataIngredientsProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
> {
  fieldName: TName
  label: string
  control: Control<TFieldValues>
  form?: UseFormReturn<TFieldValues>
  helperText?: string
  error?: boolean
  errorMessage?: string
  needsReview?: boolean
  hasImages?: boolean
  isExtracting?: boolean
  onExtract?: () => void
  onToggleReview?: () => void
  disabled?: boolean
  readOnly?: boolean
}

// ============================== Component ==============================
export default function LabelDataIngredients<
  TFieldValues extends FieldValues = FieldValues,
  TName extends ArrayPath<TFieldValues> = ArrayPath<TFieldValues>,
>(props: LabelDataIngredientsProps<TFieldValues, TName>) {
  const { t } = useTranslation("labels")
  return (
    <LabelDataNameValueList
      {...props}
      valueType="text"
      emptyStateMessage={t("data.ingredients.noIngredients")}
      addButtonLabel={t("data.ingredients.addIngredient")}
      nameEnLabel={t("data.ingredients.nameEn")}
      nameFrLabel={t("data.ingredients.nameFr")}
      valueLabel={t("data.ingredients.value")}
      unitLabel={t("data.ingredients.unit")}
      registrationNumberLabel={t(
        "data.ingredients.registrationNumber",
        "Registration number",
      )}
    />
  )
}
