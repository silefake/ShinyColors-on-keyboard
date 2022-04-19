
import { console_style } from "./util.js";
import { hook as scenario_hook } from "./scenario.js";

export const cmm = {

  get scene_manager() {
		scene_manager = SCif.app_entry(0).game?._sceneManager;
		if (!scene_manager) throw "Update";
		this._prop_check(scene_manager, ["loadScene", "pushScene", "replaceScene"]);
		return scene_manager;
  }, 

  get load_scene_fn() {
  	let load_scene_fn = SCif.app_entry(10).default
  	this._prop_check(load_scene_fn, ["loadSceneAsync"]);
  	return load_scene_fn;
  }, 

  get adv_helper() {
		let adv_helper = SCif.app_entry(481).default;
		this._prop_check(adv_helper, ["createAdvPlayer", "loadJsonAndResources"]);
		return adv_helper;
  }, 

  _prop_check: function(module, props) {
  	props.forEach(prop => {
			if (!prop in module) {
				throw "Update";
			}
  	});
  }


};



export const SCif = {
	enza_entry: null, 
	app_entry: null, 
	cmm

};

export async function init() {
	await intercept(false);
	scenario_hook();
}

function intercept(modification_before_init) {
	return new Promise((resolve, _) => {

		let orig_call = Function.prototype.call;
		Function.prototype.call = new Proxy(orig_call, {
		  apply(target, self, args) {

		    if (args.length >= 4 ) {
		    	// these works just because the execution order of the scripts
		      switch (args[1].i) {
		        case 103:
		          SCif.enza_entry = args[3];
		          console.info("Enza Entry ", args[1].i, SCif.enza_entry);
		          break;
		        case 590:
		          SCif.app_entry = args[3];
		          console.info("App Entry ", args[1].i, SCif.app_entry);
		          break;
		        case 651:
		          args[3](0)?.sceneManager && probe(args[3](0).sceneManager) && (modification_before_init = true);
		          break;
		      }
		    
			    if (SCif.enza_entry !== null && SCif.app_entry !== null && modification_before_init) {
			      Function.prototype.call = orig_call;
			      resolve();
			    }
		    }

		    return Reflect.apply(target, self, args);
		  }
		});

	});
};

// Modify prototype function before (new SceneManager).init() call, after where Object.freeze() happens 
function probe(Mgr) {
	let probe_list = ["find", "loadScene", "pushScene", "replaceScene"];

	probe_list.forEach((fn) => {

		Mgr[`orig_${fn}`] = Mgr[fn];
		Mgr[fn] = function(arg) {
			let ret = Mgr[`orig_${fn}`].call(this, arg);
			console.info(`%c scene_manager.${fn}(arg) `, console_style("#0090dd"),  arg);
			return ret;
		};
	});

	return true;
}

console.info("%c SCif ", console_style("#994AC4"), SCif);