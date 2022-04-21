
import { cmm } from "./module.js";

const producing_action = {

  handler: function(key) {
    switch (key) {
      case "w":
        this.previous_action_type_tab();
        break;
      case "s":
        this.next_action_type_tab();
        break;
      case "a":
        this.arrow_prev();
        break;
      case "d":
        this.arrow_next();
        break;
      case "q":
        this.back();
        break;
      case "e":
        this.right_control_button();

    }
  }, 

  next_action_type_tab: function() {
    const tab_list = cmm.require("producing_action_tab_list");
    const length = tab_list.children.length;
    let current = tab_list.children.findIndex((tab) => tab.selected === true);
    current = Math.min(current + 1, length - 1);
    tab_list.children[current].emit("touchstart", tab_list.children[current]);
  }, 

  previous_action_type_tab: function() {
    const tab_list = cmm.require("producing_action_tab_list");
    let current = tab_list.children.findIndex((tab) => tab.selected === true);
    current = Math.max(current - 1, 0);
    tab_list.children[current].emit("touchstart", tab_list.children[current]);
  }, 

  arrow_next: function() {
    cmm.require("producing_action_arrow_next").emit("tap");
  }, 

  arrow_prev: function() {
    cmm.require("producing_action_arrow_prev").emit("tap");
  }, 

  back: function() {
    cmm.require("producing_action").emit("back");
  }, 

  right_control_button: function() {
    cmm.require("producing_action_right_control_button").emit("tap");
  }


}


const producing_top = {
  handler: function(key) {
    switch (key) {
      case "q":
        this.goto_action();
        break;
    }
  }, 

  goto_action: function() {
    cmm.require("producing_produce_button").emit("tap");
  }
}

export { producing_action, producing_top };