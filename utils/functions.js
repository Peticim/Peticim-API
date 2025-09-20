// Klasör tipine göre fotoğraf boyutlandırmalarını getiren fonksiyon
export const getTransformation = (folder) => {
  if (folder === "profile_images") {
    return [
      { width: 400, height: 400, crop: "limit" },
      { quality: "auto" },
      { fetch_format: "auto" },
    ];
  } else if (folder.includes("Listings")) {
    return [
      { width: 1200, height: 1200, crop: "limit" },
      { quality: "auto:good" },
      { fetch_format: "auto" },
    ];
  } else {
    return [];
  }
};