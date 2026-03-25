import LinkIcon from "@mui/icons-material/Link"
import {
  Box,
  Button,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material"
import { useTranslation } from "react-i18next"
import type { ProductPublic } from "#/api"
import { useLanguage } from "#/stores/useLanguage"

interface ProductListItemProps {
  product: ProductPublic
  onAssociate?: (product: ProductPublic) => void
  disabled?: boolean
  divider?: boolean
}

export default function ProductListItem({
  product,
  onAssociate,
  disabled = false,
  divider = true,
}: ProductListItemProps) {
  const { t } = useTranslation("labels")
  const { language } = useLanguage()

  const displayName =
    language === "fr"
      ? product.name_fr || product.name_en
      : product.name_en || product.name_fr

  const displayBrand =
    language === "fr"
      ? product.brand_name_fr || product.brand_name_en
      : product.brand_name_en || product.brand_name_fr

  const fallbackName = t("common.unnamedProduct", "Unnamed Product")
  const fallbackBrand = t("common.noBrand", "No Brand")

  return (
    <ListItem
      divider={divider}
      sx={{
        px: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
      }}
    >
      <ListItemText
        sx={{ minWidth: 0 }} // Critical for ellipsis in flexbox
        primary={
          <Typography
            variant="body1"
            sx={{
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.2,
            }}
          >
            {displayName || fallbackName}
          </Typography>
        }
        secondary={
          <Stack spacing={0.25} sx={{ mt: 0.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayBrand || fallbackBrand}
            </Typography>
            <Typography
              variant="caption"
              color="text.primary"
              sx={{
                fontWeight: 500,
                display: "block",
                fontFamily: "monospace", // Makes IDs easier to read
                bgcolor: "action.hover",
                px: 0.5,
                borderRadius: 0.5,
                width: "fit-content",
              }}
            >
              {product.registration_number}
            </Typography>
          </Stack>
        }
      />
      <Box sx={{ flexShrink: 0 }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<LinkIcon />}
          onClick={() => onAssociate?.(product)}
          disabled={disabled}
        >
          {t("data.sections.association.associate", "Associate")}
        </Button>
      </Box>
    </ListItem>
  )
}
