import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import ChainedBackend from "i18next-chained-backend";
import Backend from "i18next-http-backend";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";
const debugMode = process.env.NEXT_PUBLIC_DEBUG === "true";

i18n
  .use(Backend)
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  .use(ChainedBackend)
  // init i18next
  .init({
    debug: debugMode,
    fallbackLng: "fr",
    lng: ["en", "fr"],
    interpolation: {
      escapeValue: false,
    },
    backend: {
      backends: [
        resourcesToBackend(
          (lng, ns) => import(`../../public/locales/${lng}/${ns}.json`),
        ),
      ],
      backendOptions: [
        {
          loadPath: "/locales/{{lng}}/{{ns}}.json",
        },
        {
          loadPath: "http://localhost:3000/locales/{{lng}}/{{ns}}.json",
        },
        {
          loadPath:
            "https://fertiscan.inspection.alpha.canada.ca/locales/{{lng}}/{{ns}}.json",
        },
      ],
    },
  });

export default i18n;
