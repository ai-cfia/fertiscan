import AddCircleIcon from "@mui/icons-material/AddCircle"
import LinkIcon from "@mui/icons-material/Link"
import {
  Alert,
  Box,
  Button,
  Divider,
  LinearProgress,
  List,
  Paper,
  Stack,
  Typography,
} from "@mui/material"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useServerFn } from "@tanstack/react-start"
import { useTranslation } from "react-i18next"
import { useDebounce } from "use-debounce"
import LabelDataAccordionSection from "#/components/Common/LabelDataAccordionSection"
import ProductListItem from "#/components/Common/ProductListItem"
import {
  readProductByIdEditorFn,
  searchProductsEditorFn,
} from "#/server/label-editor"
import { useLanguage } from "#/stores/useLanguage"

// ============================== Product Association Section ==============================
interface ProductAssociationSectionProps {
  label: any
  registrationNumber?: string
  brandNameEn?: string
  brandNameFr?: string
  productNameEn?: string
  productNameFr?: string
  accordionState: boolean
  onAccordionChange: (isExpanded: boolean) => void
  onAssociate: (productId: string) => void
  onCreateAndAssociate: () => void
  onUnlink?: () => void
  isLinking?: boolean
  isCreating?: boolean
  isUnlinking?: boolean
  disabled?: boolean
}

export default function ProductAssociationSection({
  label,
  registrationNumber,
  brandNameEn,
  brandNameFr,
  productNameEn,
  productNameFr,
  accordionState,
  onAccordionChange,
  onAssociate,
  onCreateAndAssociate,
  onUnlink,
  isLinking = false,
  isCreating = false,
  isUnlinking = false,
  disabled = false,
}: ProductAssociationSectionProps) {
  const { t } = useTranslation("labels")
  const { language } = useLanguage()
  const readProductById = useServerFn(readProductByIdEditorFn)
  const searchProducts = useServerFn(searchProductsEditorFn)

  // Group search parameters for debouncing
  const searchParams = {
    registration_number: registrationNumber?.trim() || undefined,
    brand_name_en: brandNameEn?.trim() || undefined,
    brand_name_fr: brandNameFr?.trim() || undefined,
    name_en: productNameEn?.trim() || undefined,
    name_fr: productNameFr?.trim() || undefined,
  }

  const [debouncedSearchParams] = useDebounce(searchParams, 500)

  const hasSearchCriteria = Object.values(debouncedSearchParams).some(
    (val) => val !== undefined && val !== "",
  )

  const isLinked = !!label?.product_id

  // Query for the linked product data if it's already linked
  const { data: linkedProduct, isLoading: isLoadingLinked } = useQuery({
    queryKey: ["product", label?.product_id],
    queryFn: async () => {
      if (!label?.product_id) return null
      return await readProductById({
        data: { productId: label.product_id },
      })
    },
    enabled: !!label?.product_id,
  })

  const displayName =
    language === "fr"
      ? linkedProduct?.name_fr || linkedProduct?.name_en
      : linkedProduct?.name_en || linkedProduct?.name_fr

  const displayBrand =
    language === "fr"
      ? linkedProduct?.brand_name_fr || linkedProduct?.brand_name_en
      : linkedProduct?.brand_name_en || linkedProduct?.brand_name_fr

  const fallbackName = t("common.unnamedProduct", "Unnamed Product")
  const fallbackBrand = t("common.noBrand", "No Brand")

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ["products", "search", debouncedSearchParams],
    queryFn: async () => {
      if (!hasSearchCriteria || isLinked) return { count: 0 }
      const page = await searchProducts({ data: debouncedSearchParams })
      return {
        items: page.items ?? [],
        count: page.total ?? 0,
      }
    },
    enabled: hasSearchCriteria && !isLinked,
    placeholderData: keepPreviousData,
  })

  const getStatusAction = () => {
    if (isLinked) {
      if (isLoadingLinked) {
        return (
          <Typography variant="caption" color="text.secondary">
            {t("common.loading", "Loading linked product...")}
          </Typography>
        )
      }
      return (
        <Typography variant="body2" color="success.main">
          {t("data.sections.association.linked", "Product associated")}
        </Typography>
      )
    }

    if (isSearching || isLinking || isCreating || isUnlinking) {
      return (
        <Typography variant="caption" color="text.secondary">
          {isSearching
            ? t("common.loading", "Searching...")
            : t("common.processing", "Processing...")}
        </Typography>
      )
    }

    if (!hasSearchCriteria) {
      return (
        <Typography variant="body2" color="text.secondary">
          {t(
            "data.sections.association.missingCriteria",
            "At least one product attribute required for search",
          )}
        </Typography>
      )
    }

    const count = searchResults?.count ?? 0
    if (count > 0) {
      return (
        <Typography variant="body2" color="warning.main">
          {t("data.sections.association.matchesFound", {
            count,
            defaultValue: "{{count}} potential matches found",
          })}
        </Typography>
      )
    }

    return (
      <Typography variant="body2" color="text.secondary">
        {t("data.sections.association.noMatch", "No matching product found")}
      </Typography>
    )
  }

  return (
    <LabelDataAccordionSection
      section="association"
      sectionKey="association.title"
      expanded={accordionState}
      onChange={(_section, isExpanded) => onAccordionChange(isExpanded)}
      id="product-association"
      scrollMarginTop="120px"
      action={getStatusAction()}
    >
      <Box
        sx={{
          opacity: disabled ? 0.7 : 1,
          position: "relative",
          minHeight: isLinked ? "auto" : 120,
        }}
      >
        {/* Subtle Progress Bar */}
        {!isLinked && (isSearching || isLinking || isCreating) && (
          <LinearProgress
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              borderTopLeftRadius: "inherit",
              borderTopRightRadius: "inherit",
            }}
          />
        )}

        {/* State 1: Already Linked */}
        {isLinked && (
          <Stack spacing={2}>
            <Alert severity="success" icon={<LinkIcon />}>
              {t(
                "data.sections.association.linkedMessage",
                "This label is linked to a product entry.",
              )}
            </Alert>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                {t("data.sections.association.linkedProduct", "Linked Product")}
              </Typography>
              <Typography variant="h6">
                {displayName || fallbackName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {displayBrand || fallbackBrand}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 1,
                  fontFamily: "monospace",
                  bgcolor: "action.hover",
                  px: 0.5,
                  borderRadius: 0.5,
                  width: "fit-content",
                  fontWeight: 600,
                  color: "text.primary",
                }}
              >
                {linkedProduct?.registration_number}
              </Typography>
              <Button
                size="small"
                color="error"
                sx={{ mt: 2 }}
                disabled={isUnlinking || disabled}
                variant="outlined"
                onClick={onUnlink}
              >
                {t("data.sections.association.unlink", "Unlink Product")}
              </Button>
            </Paper>
          </Stack>
        )}

        {/* State 2: Not Linked (Baseline containing Search results and Draft) */}
        {!isLinked && (
          <Stack spacing={3}>
            {/* 2a: Search Results List (Only if matches found) */}
            {(searchResults?.count ?? 0) > 0 && (
              <Box>
                <List disablePadding>
                  {searchResults?.items?.map((product) => (
                    <ProductListItem
                      key={product.id}
                      product={product}
                      disabled={isLinking || isCreating || disabled}
                      onAssociate={() => onAssociate(product.id)}
                    />
                  ))}
                </List>
                <Divider sx={{ mt: 2 }} />
              </Box>
            )}

            {/* 2b: Creation Draft (Always visible as baseline) */}
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: "action.hover",
              }}
            >
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                {t(
                  "data.sections.association.creationDraft",
                  "Create New Product Entry",
                )}
              </Typography>
              <Typography
                component="p"
                variant="body2"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                {t(
                  "data.sections.association.creationHelp",
                  "We can create a new product entry using the data extracted from this label.",
                )}
              </Typography>

              <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                {[
                  {
                    label: t("data.sections.product", "Product"),
                    en: productNameEn,
                    fr: productNameFr,
                  },
                  {
                    label: t("data.sections.brand", "Brand"),
                    en: brandNameEn,
                    fr: brandNameFr,
                  },
                ].map((item, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.025em",
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        fontSize: "0.825rem",
                        textAlign: "right",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {item.en || "—"}
                      <Box
                        component="span"
                        sx={{ color: "text.disabled", mx: 1 }}
                      >
                        /
                      </Box>
                      {item.fr || "—"}
                    </Typography>
                  </Box>
                ))}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 2,
                    mt: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.025em",
                    }}
                  >
                    {t(
                      "data.sections.registrationNumber",
                      "Registration Number",
                    )}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      fontSize: "0.825rem",
                    }}
                  >
                    {registrationNumber || "—"}
                  </Typography>
                </Box>
              </Stack>

              <Button
                fullWidth
                variant="contained"
                startIcon={<AddCircleIcon />}
                disabled={
                  (!registrationNumber?.trim() &&
                    !brandNameEn?.trim() &&
                    !brandNameFr?.trim() &&
                    !productNameEn?.trim() &&
                    !productNameFr?.trim()) ||
                  isLinking ||
                  isCreating ||
                  disabled
                }
                onClick={onCreateAndAssociate}
              >
                {t(
                  "data.sections.association.createAndAssociate",
                  "Create & Associate",
                )}
              </Button>
            </Paper>
          </Stack>
        )}
      </Box>
    </LabelDataAccordionSection>
  )
}
