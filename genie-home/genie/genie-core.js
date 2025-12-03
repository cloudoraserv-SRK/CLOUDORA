// genie-core.js — export named genieCore
export const genieCore = {
  /* basic initialization */
  init(opts = {}) {
    this.opts = opts;
    // any UI wiring can go here
    console.log("Genie core initialized", opts);
  },

  async handleUserInput(text){
    // placeholder logic — replace with your real NLU / prompts
    console.log("User said:", text);
    // simple reply
   generateReply(text){
  if (text.includes("website")) return "Sure! I can help you build a website. Do you want a business website, portfolio, or e-commerce?";
  if (text.includes("business")) return "Great! What type of business do you want to grow?";
  if (text.includes("help")) return "I’m here! Tell me what you need, boss.";
  return "Okay! How can I support you further?";
}


  start(){
    console.log("Genie started");
  }
};
