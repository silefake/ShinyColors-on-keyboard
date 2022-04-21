import { singleton, cmm } from "./module.js";
import { show_hint } from "./util.js";


const scenario = {
  adv_player: null, 

  speed_alter: [0.6, 0.8, 1, 1.4, 2, 2.8, 3.8, 5, 6.4], 
  speed_index: 2, 
  
  hook: function() {
    singleton.adv_helper.orig_createAdvPlayer = singleton.adv_helper.createAdvPlayer;
    singleton.adv_helper.createAdvPlayer = function(e) {
      let ret = singleton.adv_helper.orig_createAdvPlayer(e);
      console.info("adv_helper.createAdvPlayer() -> ", ret);
      scenario.hook_components(ret);
      scenario.adv_player = ret;
      return ret;
    };
  }, 
  hook_components: function(adv_player) {
    adv_player.scenarioLogLayer._stackedTracks_idx = [];
    adv_player.scenarioLogLayer._characterStage_states = [];
    adv_player.scenarioLogLayer.orig_stackTrack = adv_player.scenarioLogLayer.stackTrack;

    adv_player.scenarioLogLayer.stackTrack = function(track) {
      this._stackedTracks_idx.push(adv_player._trackManager._current);

      // Since character is registered after the stackTrack() call, 
      // what we push here is always the state of previous track, 
      // and the first element(state) been pushed should always be an empty obj
      this._characterStage_states.push(Object.assign({}, adv_player._characterStage._repository));

      return this.orig_stackTrack(track);
    }   
  }, 

  handler: function(key) {
    switch (key) {
      case "-":
        this.text_speed_down();
        break;
      case "=":
        this.text_speed_up();
        break;
      case "s":
        this.toggle_comm_log();
        break;
      case "d":
        this.comm_forward();
        break;
      case "a":
        this.comm_backward();
        break;
    }
  }, 

  text_speed_up: function() {
    this.speed_index = Math.min(this.speed_index + 1, this.speed_alter.length - 1);
    this.adv_player.scenarioPlayer.speed = this.speed_alter[this.speed_index];
    show_hint(`Text speed: ${this.adv_player.scenarioPlayer.speed}`);
  }, 

  text_speed_down: function() {
    this.speed_index = Math.max(this.speed_index - 1, 0);
    this.adv_player.scenarioPlayer.speed = this.speed_alter[this.speed_index];
    show_hint(`Text speed: ${this.adv_player.scenarioPlayer.speed}`);
  }, 

  toggle_comm_log: function() {
    let adv_player = cmm.require("adv_player");
    adv_player._isOpenedLog ? 
      adv_player.scenarioLogLayer.closeButton.emit("tap") :
      adv_player.mainController._scenarioMenu.emit("openLog");
  }, 

  comm_forward: function() {
    let adv_player = cmm.require("adv_player");
    if (adv_player._isOpenedLog) return;
    adv_player._interactionLayer.emit("tap");
  }, 

  comm_backward: function() {
    let p = cmm.require("adv_player");
    if (p._isOpenedLog) return;
    if (p.scenarioLogLayer._stackedTracks.length <= 1) {
      return;
    }
    if ( !(!p._selectList.active && 
           true) ) {
      return;
    }

    // pop current
    // ct: current track
    let ct = p.scenarioLogLayer._stackedTracks.pop();
    let ct_idx = p.scenarioLogLayer._stackedTracks_idx.pop();
    p.scenarioLogLayer._characterStage_states.pop();
    // pop previous
    // tt: target track
    let tt = p.scenarioLogLayer._stackedTracks.pop();
    let tt_idx = p.scenarioLogLayer._stackedTracks_idx.pop();
    let tt_chst_state = p.scenarioLogLayer._characterStage_states.pop();

    // isSelectedItem: host property
    if (tt.isSelectedItem) {
      tt = p.scenarioLogLayer._stackedTracks.pop();
      tt_idx = p.scenarioLogLayer._stackedTracks_idx.pop();
      tt_chst_state = p.scenarioLogLayer._characterStage_states.pop();

      if (!p._selectList.orig_appear) {
        p._selectList.orig_appear = p._selectList.appear;
        p._selectList.appear = function() {
          this.show();
          return this.orig_appear();
        }
      }
    }

    this._rollback(ct, ct_idx, tt, tt_idx, tt_chst_state);

    // when forwarding to the end track, nextLabel is set to "end" (in playTrack()), we need to reset it every time.
    // may cause some other issues
    p._trackManager._nextLabel = null;

    console.info("target track: ", tt_idx, tt);
    p._trackManager._current = tt_idx;
    p._playTrack(tt);
  }, 


  _rollback: function(ct, ct_idx, tt, tt_idx, tt_chst_state) {
    this._char_unregister(tt_chst_state);

    let recovery_list = new RecoveryList(this.adv_player._trackManager._tracks, ct_idx, tt_idx);
    recovery_list.search(this.adv_player._trackManager._tracks, tt_idx);
    recovery_list.execute(this.adv_player);
  }, 

  _char_unregister: function(tt_chst_state) {
    let ct_chst_state = this.adv_player._characterStage._repository;

    Object.entries(ct_chst_state)
      .filter(([label, character_instance]) => !tt_chst_state.hasOwnProperty(label))
      .forEach(([label, character_instance]) => {
        console.info("unregister: ", label);
        this.adv_player._characterStage.removeChild(character_instance);
        character_instance.destroy();
        delete ct_chst_state[label];
      });
  }

};


class RecoveryList {
  constructor(tracks, ct_idx, tt_idx) {
    let collect = {
      character: {}, 
      bg: new RecoveryItem()
    };

    for (let i = ct_idx; i >= tt_idx; i--) {
      let label = tracks[i]["charLabel"];
      if ( label ) {
        if (collect.character[label] === undefined) {
          collect.character[label] = { 
            effect: new RecoveryItem(), 
            position: new RecoveryItem() 
          };
        }

        if ( tracks[i]["charEffect"] ) {
          collect.character[label].effect.next_state();
        }
        if ( tracks[i]["charPosition"] ) {
          collect.character[label].position.next_state();
        }
      }

      if ( tracks[i]["bg"] ) {
        collect.bg.next_state();
      }
    }

    this.collect = collect;
  }

  search(tracks, tt_idx) {
    // search from previous of the target track
    for (let i = tt_idx - 1; i >= 0; i--) {
      let label = tracks[i]["charLabel"];

      if ( label && tracks[i]["charEffect"] && this.collect.character[label]?.effect.is_watching() ) {
        if ( tracks[i]["charEffect"].type === "to" ){
          this.collect.character[label].effect.set_data(tracks[i]["charEffect"]);
        } 
        else if ( tracks[i]["charEffect"].type === "from" && tracks[i]["charSpine"] ) {
          this.collect.character[label].effect.set_data(this.synthetic_effect(tracks[i]["charEffect"]));
        } 
        else {
          this.collect.character[label].effect.set_data(tracks[i]["charEffect"]);
        }

        this.collect.character[label].effect.next_state();
      }

      if ( label && tracks[i]["charPosition"]  && this.collect.character[label]?.position.is_watching() ) {
        this.collect.character[label].position.set_data(tracks[i]["charPosition"]);
        this.collect.character[label].position.next_state();
      }

      let bg = tracks[i]["bg"];
      if ( bg && this.collect.bg.is_watching() ) {
        this.collect.bg.set_data(bg);
        this.collect.bg.next_state();
      }
    }
  }

  execute(adv_player) {

    Object.entries(this.collect.character).forEach(([label, items]) => {
      items.effect = items.effect.take();
      items.position = items.position.take();
    });
    this.collect.bg = this.collect.bg.take();

    console.info(this.collect);

    Object.entries(this.collect.character)
      .filter(([label, items]) => {
        return items.effect !== null || items.position !== null;
      })
      .forEach(([label, items]) => {
        adv_player._characterStage.control({
          label: label, 
          position: items.position, 
          effect: items.effect,
          effectSpeed: adv_player._effectSpeed
        });
      });


    if ( this.collect.bg !== null ) {
      adv_player._bgLayer.control(this.collect.bg, "fade", 560);
    }
  }

  synthetic_effect(effect) {
    effect.type = "to";
    effect.alpha = 1;
    return effect;
  }

}

class RecoveryItem {
  static next_state = {
    ignore: "watching", 
    watching: "detected", 
    detected: "detected"
  };

  constructor() {
    this.state = "ignore";
    this.data = null;
  }
  next_state() {
    this.state = RecoveryItem.next_state[this.state];
  }
  set_data(data) {
    this.data = data;
  }
  is_watching() {
    return this.state === "watching";
  }
  is_detected() {
    return this.state === "detected";
  }
  take() {
    if (this.is_detected()) {
      return this.data;
    } else {
      return null;
    }
  }
}


export { scenario };