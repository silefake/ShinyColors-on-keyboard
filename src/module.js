
import { console_style } from "./util.js";
import { scenario } from "./scenario.js";



async function init() {
  await intercept(false);
  scenario.hook();
}

function intercept(modification_before_init) {
  return new Promise((resolve, _) => {

    let orig_call = Function.prototype.call;
    Function.prototype.call = new Proxy(orig_call, {
      apply(target, self, args) {

        if (args.length >= 4 ) {
          // these work just because of the execution order of the scripts
          switch (args[1].i) {
            case 103:
              if (SCif.enza_entry === null) {
                SCif.enza_entry = args[3];
              } else if (SCif.ezg_entry === null) {
                SCif.ezg_entry = args[3];
              }
              break;
            case 590:
              if (SCif.app_entry === null) {
                SCif.app_entry = args[3];
              }
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

const SCif = {
  enza_entry: null, 
  ezg_entry: null, 
  app_entry: null
};

const singleton = {
  _scene_manager: null, 
  _load_scene_fn: null, 
  _adv_helper: null, 

  get scene_manager() {
    if (this._scene_manager === null) {
      let instance = SCif.app_entry(0).game?._sceneManager;
      this._check_prop(instance, ["loadScene", "pushScene", "replaceScene"]);
      this._scene_manager = instance;
    }
    return this._scene_manager;
  }, 

  get load_scene_fn() {
    if (this._load_scene_fn === null) {
      let obj = SCif.app_entry(10).default
      this._check_prop(obj, ["loadSceneAsync"]);
      this._load_scene_fn = obj;
    }
    return this._load_scene_fn;
  }, 

  get adv_helper() {
    if (this._adv_helper === null) {
      let obj = SCif.app_entry(483).default;
      this._check_prop(obj, ["createAdvPlayer", "loadJsonAndResources"]);
      this._adv_helper = obj;
    }
    return this._adv_helper;
  }, 

  _check_prop: function(module, props) {
    if (module === undefined) {
      throw "Update";
    }
    props.forEach(prop => {
      if (!prop in module) {
        throw "Update";
      }
    });
  }

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



const cmm = {
  _check_structure: function(target, checklist) {
    let errmsg = "";
    Object.entries(checklist)
      .forEach(([key, value]) => {
        if ( !(key in target) ) {
          errmsg += key;
          errmsg += "\n";
        }
        else if ( value !== null ) {
          let sub = this._check_structure(target[key], value);
          if (sub !== "") {
            errmsg += key;
            errmsg += "\n";
            errmsg += sub.split("\n")
                         
                         .map((line) => "  " + line)
                         .join("\n");
          }
        }
      });
    return errmsg;
  }, 

  log: function(message = "") {
    if (message !== "") {
      console.info("check failed: \n" + message);
    }
  }, 

  require: function(name) {
    let ret = null;
    let structure = null;

    switch (name) {
      case "adv_player":
        ret = singleton.scene_manager.currentScene.children[0] || null;
        structure = {
          _isOpenedLog: null, 
          scenarioLogLayer: {
            _stackedTracks: null, 
            stackTrack: null, 
            closeButton: null
          }, 
          mainController: {
            _scenarioMenu: null
          }, 
          _trackManager: {
            _current: null, 
            _nextLabel: null
          }, 
          _characterStage: {
            _repository: null, 
            removeChild: null, 
            control: null
          }, 
          scenarioPlayer: {
            speed: null
          }, 
          _interactionLayer: null, 
          _selectList: {
            active: null, 
            appear: null
          }, 
          _bgLayer: {
            control: null
          }
        };
        break;
      case "producing_action_tab_list":
        ret = singleton.scene_manager.currentScene._mainLayer?._actionLayer?._actionTypeTabList || null;
        break;
      case "producing_action_arrow_next":
        ret = singleton.scene_manager.currentScene._mainLayer?._actionLayer?._actionSelect?._actionListCarousel?._arrowNext || null;
        break;
      case "producing_action_arrow_prev":
        ret = singleton.scene_manager.currentScene._mainLayer?._actionLayer?._actionSelect?._actionListCarousel?._arrowPrev || null;
        break;
      case "producing_action_right_control_button":
        ret = singleton.scene_manager.currentScene._mainLayer?._actionLayer?._rightControlButton
        break;
      case "producing_action":
        ret = singleton.scene_manager.currentScene._mainLayer?._actionLayer;
        break;
      case "producing_produce_button":
        ret = singleton.scene_manager.currentScene._mainLayer?._topLayer?._produceButton?.children[0];
        break;
    }

    if (ret === null) {
      throw "Update";
    }
    
    if (structure !== null) {
      this.log( this._check_structure(ret, structure) );
    }
    return ret;
  }

};


export { singleton, init, cmm };