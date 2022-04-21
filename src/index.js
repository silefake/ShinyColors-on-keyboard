// ==UserScript==
// @name        SC_test
// @namespace   
// @match       https://shinycolors.enza.fun/*
// @run-at      document-start
// @grant       none
// @version     1.0
// @author      
// @description 2022/4/15
// ==/UserScript==

import { init } from "./module.js";
import { scenario } from "./scenario.js";
import { producing_action, producing_top } from "./produce.js";
import { is_scenario_playing, is_producing_action, is_producing_top } from "./scene.js";

init();

function main_handler(key) {
  if (is_scenario_playing()) {
    scenario.handler(key);
  } else if (is_producing_action()) {
    producing_action.handler(key);
  } else if (is_producing_top()) {
    producing_top.handler(key);
  }
}

window.onload = () => {
  document.body.addEventListener("keydown", (e) => {
    if (!e.repeat) {
      main_handler(e.key);
    }
  });
}
