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
import { scenario, is_scenario_playing } from "./scenario.js";

function main_handler(key) {
	if (is_scenario_playing()) {
		scenario.handler(key);
	}
}

init();

window.onload = function() {

  document.body.addEventListener("keydown", (e) => {
    if (!e.repeat) {
      main_handler(e.key);
    }
  });
}
