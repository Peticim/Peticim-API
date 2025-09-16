import { FIREBASE_AUTH_ERRORS } from "./auth.js";
export const ALL_FIREBASE_ERRORS = {
  ...FIREBASE_AUTH_ERRORS,
  DEFAULT: {
    message: "Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.",
    statusCode: 500,
  },
};
