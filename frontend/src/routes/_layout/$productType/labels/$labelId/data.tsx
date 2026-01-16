import { Typography } from "@mui/material"
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

export const Route = createFileRoute(
  "/_layout/$productType/labels/$labelId/data",
)({
  component: LabelData,
})

function LabelData() {
  const { t } = useTranslation("labels")
  return <Typography>{t("data.placeholder")}</Typography>
}
