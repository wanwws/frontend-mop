import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend) // โหลด JSON จาก public/locales
  .use(initReactI18next)
  .init({
    lng: "en", // ค่าเริ่มต้น
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    backend: {
      loadPath: "/locales/{{lng}}.json", // โหลดไฟล์ JSON จาก public/locales/
    },
  });

export default i18n;
