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
    const reply = `I heard: "${text}". How can I help further?`;
    return reply;
  },

  start(){
    console.log("Genie started");
  }
};
