import { showPanel } from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { explain, translate, moderate } from "./openai";
import { debug } from "./utils";

const enum Query  {
  EXPLAIN_CODE = 1,
  HAS_ERRORS = 2
}

const enum Command {
  RUN = 1,
  EXPLAIN = 2,
  TRANSLATE = 3,
  DISPLAY = 4
}

type AITutorEffect = {
  command: Command;
  language?: string;
  apiKey?: string;
  query?: Query;
  result?: any;
}

const THINKING_MESSAGE = "[Thinking]";
const TRANSLATING_MESSAGE = "[Translating]";
const NO_API_KEY_MESSAGE = "[No API Key]";
const API_ERROR_MESSAGE = "[OpenAI API Error]";

const MODERATION_FAILED_MESSAGE =
  "The selection is not appropriate and violates Code.org's terms of service.";

const toggleHelp = StateEffect.define<AITutorEffect>();

const helpPanelState = StateField.define<any>({
  create: () => {},
  update(value, tr) {
    for (let e of tr.effects) if (e.is(toggleHelp)) value = e.value;
    return value;
  },
  provide: (f) => showPanel.from(f, (on) => (on ? createHelpPanel : null)),
});

function createHelpPanel(view: EditorView) {
  // Initialize the panel
  let dom = document.createElement("div");
  dom.className = "cm-help-panel";

  // Displatch the initial run command
  setTimeout(() => {
    view.dispatch({
      effects: toggleHelp.of({
        ...view.state.field(helpPanelState, false),
        command: Command.RUN,
      }),
    });
  }, 1);

  return {
    top: true,
    dom,
    update(update) {
      debug("Update in viewPlugin");
      let effect = update.state.field(helpPanelState, false);
      debug(effect);

      // Capture the editor selection
      let range = view.state.selection.main;
      let doc = view.state.doc;
      let selection = doc.sliceString(range.from, range.to);

      // Initial text update
      dom.textContent = THINKING_MESSAGE;

      // Check for some kind of API key
      if (!effect.apiKey || effect.apiKey === "undefined" || effect.apiKey === "null" ||  effect.apiKey === "") {
        return dom.textContent = NO_API_KEY_MESSAGE;
      };

      // Run command - sends the selection through the moderation API
      if (effect.command === Command.RUN) {
        moderate(effect.apiKey, selection).then((response) => {
          if (response === false) {
            view.dispatch({
              effects: toggleHelp.of({
                ...view.state.field(helpPanelState, false),
                command: Command.TRANSLATE,
                result: MODERATION_FAILED_MESSAGE,
              }),
            });
          } else {
            view.dispatch({
              effects: toggleHelp.of({
                ...view.state.field(helpPanelState, false),
                command: Command.EXPLAIN,
              }),
            });
          }
        }, () => {
          dom.textContent = API_ERROR_MESSAGE;
        });
      }

      // Explain command - sends the selection through the explain API
      if (effect.command === Command.EXPLAIN) {
        dom.textContent = THINKING_MESSAGE;
        explain(effect.apiKey, selection, effect.query).then((answer) => {
          view.dispatch({
            effects: toggleHelp.of({
              ...view.state.field(helpPanelState, false),
              command: Command.TRANSLATE,
              result: answer,
            }),
          });
        }, () => {
          dom.textContent = API_ERROR_MESSAGE;
        });
      }

      // Translate command - sends the selection through the translate API
      if (effect.command === Command.TRANSLATE) {
        dom.textContent = TRANSLATING_MESSAGE;
        if (effect.language === "en-us") {
          setTimeout(() => {
            view.dispatch({
              effects: toggleHelp.of({
                ...view.state.field(helpPanelState, false),
                command: Command.DISPLAY,
                result: effect.result,
              }),
            });
          }, 1);
        } else {
          translate(effect.apiKey, effect.result, effect.language).then((answer) => {
            view.dispatch({
              effects: toggleHelp.of({
                ...view.state.field(helpPanelState, false),
                command: Command.DISPLAY,
                result: answer,
              }),
            });
          }), () => {
            dom.textContent = API_ERROR_MESSAGE;
          };
        }
      }

      // Display command - displays the result in the panel
      if (effect.command === Command.DISPLAY) {
        dom.textContent = effect.result;
      }
    },
  };
}

const helpTheme = EditorView.baseTheme({
  ".cm-help-panel": {
    padding: "10px 50px",
    backgroundColor: "#fffa8f",
    fontFamily: "monospace",
    backgroundImage: "url('./images/aibot.png')",
    backgroundRepeat: "no-repeat",
    backgroundSize: "35px",
  },
});

const helpPanel = () => {
  return [helpPanelState, helpTheme];
};

export { toggleHelp, helpPanel, Command, Query };
//end
