import { ALL_FIREBASE_ERRORS } from "../constants/firebaseErrors/index.js";

const handleFirebaseError = (error) => {
  const mappedError = ALL_FIREBASE_ERRORS[error.code];
  if (mappedError) {
    return {
      success: false,
      message: mappedError.message,
      statusCode: mappedError.statusCode,
    };
  }
  return {
    message: ALL_FIREBASE_ERRORS.DEFAULT.message,
    statusCode: ALL_FIREBASE_ERRORS.DEFAULT.statusCode,
  };
};

export const handleError = (error) => {
  let responseMessage;
  let statusCode;
  if (error.code) {
    const { message, statusCode: firebaseStatusCode } =
      handleFirebaseError(error);
    responseMessage = message;
    statusCode = firebaseStatusCode;
  } else {
    responseMessage =
      "Profil bilgileri alınırken bir hata oluştu. Lütfen tekrar deneyin.";
    statusCode = 500;
  }
  return {
    success: false,
    message: responseMessage,
    statusCode,
  };
};
