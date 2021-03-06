
import { singleton } from "./module.js";



// eventPlayer
// album, special event, ..?
export function is_scenario_playing() {
  return !!singleton.scene_manager.currentScene.children[0]?._trackManager;
}

export function is_producing_event() {
  return !!singleton.scene_manager.currentScene._frontLayer?.children[0]?.children[0]?._trackManager;
}

export function is_producing_action() {
  return !!singleton.scene_manager.currentScene._mainLayer?._actionLayer?.parent;
}

export function is_producing_top() {
  return !!singleton.scene_manager.currentScene._mainLayer?._topLayer?.parent;
}