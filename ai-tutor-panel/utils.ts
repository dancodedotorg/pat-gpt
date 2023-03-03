const debug = (message: any) => {
  switch (typeof message) {
    case "object":
      const messageObj = { ...message };
      delete messageObj.apiKey;
      console.log(`[AI Tutor] ${JSON.stringify(messageObj)}`);
      break;
    default:
      console.log(`[AI Tutor] ${message}`);
  }
};

export { debug };
//end
