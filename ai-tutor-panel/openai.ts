import { Query } from ".";
import { debug } from "./utils";

const SYSTEM_ROLE_CONTENT =
  "You are a teaching assistant who is helping a 10 year old learn computer science.";

const gpt = (apiKey: string, prompt: string) => {
  return new Promise((resolve, reject) => {
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: SYSTEM_ROLE_CONTENT },
          { role: "user", content: prompt },
        ],
      }),
    })
      .then(
        (response) => response.json(),
        (response) => reject(response)
      )
      .then((response) => {
        if (response.error) reject(response.error);
        debug(response.choices[0].message.content);
        resolve(response.choices[0].message.content);
      });
  });
};

const explain = (apiKey: string, code: string, query: Query) => {
  let prompt = "";
  switch (query) {
    case Query.EXPLAIN_CODE:
      prompt = `In two sentences, what does the following Java code do?\n\n\`\`\`${code.trim()}\n\`\`\`\n\n and then, in one sentence, explain why every student should have the opportunity to take computer science`;
      break;
    case Query.HAS_ERRORS:
      prompt = `In two sentences, does the following Java code have any errors?\n\n\`\`\`${code.trim()}\n\`\`\`\n\n and then, in one sentence, explain why every student should have the opportunity to take computer science`;
      break;
  }
  debug(prompt);
  return gpt(apiKey, prompt);
};

const translate = (apiKey: string, text: string, language: string) => {
  const PROMPT = `Convert ${text} to ${language}`;
  debug(PROMPT);
  return gpt(apiKey, PROMPT);
};

const moderate = (apiKey: string, text: string) => {
  return new Promise((resolve, reject) => {
    fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
      }),
    })
      .then(
        (response) => response.json(),
        (response) => reject(response)
      )
      .then((response) => {
        debug(response);
        if (response.error) reject(response);
        resolve(!response.results[0].flagged);
      });
  });
};

export { explain, translate, moderate };
//end
