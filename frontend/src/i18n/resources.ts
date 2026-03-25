// ============================== i18n resources ==============================

import authEn from "#/locales/en/auth.json"
import commonEn from "#/locales/en/common.json"
import errorsEn from "#/locales/en/errors.json"
import labelsEn from "#/locales/en/labels.json"
import productsEn from "#/locales/en/products.json"
import authFr from "#/locales/fr/auth.json"
import commonFr from "#/locales/fr/common.json"
import errorsFr from "#/locales/fr/errors.json"
import labelsFr from "#/locales/fr/labels.json"
import productsFr from "#/locales/fr/products.json"

export const resources = {
  en: {
    common: commonEn,
    labels: labelsEn,
    auth: authEn,
    errors: errorsEn,
    products: productsEn,
  },
  fr: {
    common: commonFr,
    labels: labelsFr,
    auth: authFr,
    errors: errorsFr,
    products: productsFr,
  },
}
