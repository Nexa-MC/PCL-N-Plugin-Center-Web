import { createI18n } from "vue-i18n";

import zh from "./modules/zh";
import en from "./modules/en";
import { getInitialLanguage } from "./language";

const i18n = createI18n({
  allowComposition: true,
  legacy: false,
  locale: getInitialLanguage(),
  messages: {
    zh,
    en
  }
});

export default i18n;
