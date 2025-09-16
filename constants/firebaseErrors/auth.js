export const FIREBASE_AUTH_ERRORS = {
  "auth/invalid-email": {
    message: "Geçersiz e-posta adresi. Lütfen doğru bir adres girin.",
    statusCode: 400,
  },
  "auth/user-not-found": {
    message: "Bu e-posta adresine kayıtlı bir kullanıcı bulunamadı.",
    statusCode: 404,
  },
  "auth/wrong-password": {
    message: "Yanlış şifre. Lütfen tekrar deneyin.",
    statusCode: 401,
  },
  "auth/email-already-in-use": {
    message: "Bu e-posta adresi zaten kullanılıyor.",
    statusCode: 409,
  },
  "auth/weak-password": {
    message:
      "Şifreniz çok zayıf. Lütfen en az 6 karakterli daha güçlü bir şifre belirleyin.",
    statusCode: 400,
  },
  "auth/invalid-credential": {
    message: "Geçersiz kimlik bilgisi. Lütfen tekrar giriş yapın.",
    statusCode: 401,
  },
  "auth/user-disabled": {
    message: "Bu hesaba erişiminiz devre dışı bırakıldı.",
    statusCode: 403,
  },
  "auth/operation-not-allowed": {
    message:
      "Bu işlem şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.",
    statusCode: 403,
  },
  "auth/id-token-expired": {
    message: "Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.",
    statusCode: 401,
  },
  "auth/invalid-id-token": {
    message: "Oturum kimlik bilgileri geçersiz. Lütfen tekrar giriş yapın.",
    statusCode: 401,
  },
  "auth/invalid-uid": {
    message: "Geçersiz kullanıcı kimliği (UID) formatı.",
    statusCode: 400,
  },
  "auth/invalid-password": {
    message:
      "Geçersiz parola. Parolanızın doğru formatta olduğundan emin olun.",
    statusCode: 400,
  },
  "auth/missing-password": {
    message: "Parola eksik. Lütfen bir parola girin.",
    statusCode: 400,
  },
  "auth/missing-email": {
    message: "E-posta adresi eksik. Lütfen bir e-posta adresi girin.",
    statusCode: 400,
  },
  "auth/invalid-action-code": {
    message:
      "Geçersiz doğrulama kodu. Kodun süresi dolmuş veya hatalı olabilir.",
    statusCode: 400,
  },
  "auth/account-exists-with-different-credential": {
    message: "Bu e-posta adresine kayıtlı başka bir hesap bulunuyor.",
    statusCode: 409,
  },
  "auth/email-already-verified": {
    message: "Bu e-posta adresi zaten doğrulanmış.",
    statusCode: 409,
  },
};
