import { CountryCode, parsePhoneNumberFromString } from "libphonenumber-js";

export const normalizePhoneNumber = (
  phone: string,
  countryCode: CountryCode = "US",
): string => {
  try {
    const parsedNumber = parsePhoneNumberFromString(phone, countryCode);
    return parsedNumber ? parsedNumber.format("E.164") : phone;
  } catch (error) {
    console.warn(`Invalid phone number: ${phone}`, error);
    return phone;
  }
};
