
import { cmm } from "./module.js";

export const produce = {


}


export function is_producing() {
	return !!cmm.scene_manager.currentScene._mainLayer._actionLayer;
}