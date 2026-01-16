import { ToggleButton, ToggleButtonGroup } from "@mui/material"
import { useTranslation } from "react-i18next"
import { useLanguage } from "@/stores/useLanguage"

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation("common")

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newLanguage: string | null,
  ) => {
    if (newLanguage !== null) {
      setLanguage(newLanguage as "en" | "fr")
    }
  }

  return (
    <ToggleButtonGroup
      value={language}
      exclusive
      onChange={handleChange}
      size="small"
      aria-label={t("language.switcher.ariaLabel")}
    >
      <ToggleButton value="en" aria-label={t("language.en.ariaLabel")}>
        EN
      </ToggleButton>
      <ToggleButton value="fr" aria-label={t("language.fr.ariaLabel")}>
        FR
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

export default LanguageSwitcher
