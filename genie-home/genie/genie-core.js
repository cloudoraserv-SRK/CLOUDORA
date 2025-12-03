import { t } from "../i18n/t.js";

export const genieCore = {

  generateReply(text){
    text = text.toLowerCase();

    if (text.includes("website") || text.includes("site"))
      return t("genie.build_website");

    if (text.includes("business") || text.includes("grow"))
      return t("genie.grow_business");

    return t("genie.fallback");
  },

  async handleUserInput(text){
    console.log("User said:", text);

    const reply = this.generateReply(text);
    return reply;
  }
};
