import { showPanel, Panel } from "@codemirror/view";
import { StateField, StateEffect } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

import { explain, translate, moderate } from "./openai";
import { debug } from "./utils";

const MODERATION_FAILED_MESSAGE =
  "The selection is not appropriate and violates Code.org's terms of service.";

const toggleHelp = StateEffect.define<any>();

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

  setTimeout(() => {
    view.dispatch({
      effects: toggleHelp.of({
        ...view.state.field(helpPanelState, false),
        command: "moderate",
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
      dom.textContent = "[Thinking]";

      if (effect.command === "moderate" || !effect.command) {
        moderate(selection).then((response) => {
          if (response === false) {
            view.dispatch({
              effects: toggleHelp.of({
                ...view.state.field(helpPanelState, false),
                command: "translate",
                result: MODERATION_FAILED_MESSAGE,
              }),
            });
          } else {
            view.dispatch({
              effects: toggleHelp.of({
                ...view.state.field(helpPanelState, false),
                command: "explain",
              }),
            });
          }
        });
      }

      if (effect.command === "explain") {
        dom.textContent = "[Thinking]";
        explain(selection).then((answer) => {
          view.dispatch({
            effects: toggleHelp.of({
              ...view.state.field(helpPanelState, false),
              command: "translate",
              result: answer,
            }),
          });
        });
      }

      if (effect.command === "translate") {
        dom.textContent = "[Translating]";
        if (effect.language === "en-us") {
          setTimeout(() => {
            view.dispatch({
              effects: toggleHelp.of({
                ...view.state.field(helpPanelState, false),
                command: "display",
                result: effect.result,
              }),
            });
          }, 1);
        } else {
          translate(effect.result, effect.language).then((answer) => {
            view.dispatch({
              effects: toggleHelp.of({
                ...view.state.field(helpPanelState, false),
                command: "display",
                result: answer,
              }),
            });
          });
        }
      }

      if (effect.command === "display") {
        dom.textContent = effect.result;
      }
    },
  };
}

const helpTheme = EditorView.baseTheme({
  ".cm-help-panel": {
    height: "20px",
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

export { toggleHelp, helpPanel };
