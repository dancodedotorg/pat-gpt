import { EditorView, basicSetup } from "codemirror";
import { ViewPlugin } from "@codemirror/view";
import { java } from "@codemirror/lang-java";

import { helpPanel, toggleHelp, Command, Query } from "./ai-tutor-panel";

const run = async () => {
  // UI elements
  const codeButton = document.getElementById("code-button");
  const hasErrorsButton = document.getElementById("has-errors-button");

  const codeButtonEnabled = class {
    constructor() {}
    update(update) {
      let from = update.state.selection.main.from;
      let to = update.state.selection.main.to;
      if (from !== to) {
        if (codeButton?.attributes.getNamedItem("disabled")) {
          codeButton?.attributes.removeNamedItem("disabled");
        }
        if (hasErrorsButton?.attributes.getNamedItem("disabled")) {
          hasErrorsButton?.attributes.removeNamedItem("disabled");
        }
      } else {
        codeButton?.attributes.setNamedItem(
          document.createAttribute("disabled")
        );
        hasErrorsButton?.attributes.setNamedItem(
          document.createAttribute("disabled")
        );
      }
    }
  };

  // get language from URL param
  const urlParams = new URLSearchParams(window.location.search);
  const language = urlParams.get("language") || "en-us";
  const apiKey = urlParams.get("api-key") || "";

  // Load the main.java file into the editor
  const code = await fetch("Main.java").then((response) => response.text());

  // Create the main editor view
  let editor = new EditorView({
    extensions: [
      basicSetup,
      java(),
      helpPanel(),
      ViewPlugin.fromClass(codeButtonEnabled),
    ],
    parent: document.getElementById("editor") as Element,
    doc: code,
  });

  if (codeButton) {
    codeButton.onclick = () => {
      editor.dispatch({
        effects: toggleHelp.of({ language: language, apiKey: apiKey, command: Command.RUN , query: Query.EXPLAIN_CODE }),
      });
    };
  }

  if (hasErrorsButton) {
    hasErrorsButton.onclick = () => {
      editor.dispatch({
        effects: toggleHelp.of({ language: language, apiKey: apiKey, command: Command.RUN , query: Query.HAS_ERRORS }),
      });
    };
  }
};
run();
//end
