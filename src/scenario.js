import { singleton, cmm } from "./module.js";
import { show_hint } from "./util.js";


const scenario = {
  adv_player: null, 

  speed_alter: [0.6, 0.8, 1, 1.4, 2, 2.8, 3.8, 5, 6.4], 
  speed_index: 2, 
  log_scrolling: false, 
  keyflags: 0, 
  log_scroll_factor: 1, 
  
  hook: function() {
    singleton.adv_helper.orig_createAdvPlayer = singleton.adv_helper.createAdvPlayer;
    singleton.adv_helper.createAdvPlayer = function(e) {
      const ret = singleton.adv_helper.orig_createAdvPlayer(e);
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

  handle_keydown: function(key) {
    switch (key) {
      case "-":
        if ( !cmm.require("adv_player")._isOpenedLog ) {
          this.text_speed_down();
        }
        break;
      case "=":
        if ( !cmm.require("adv_player")._isOpenedLog ) {
          this.text_speed_up();
        }
        break;
      case "s":
        if ( this.log_scrolling === false ) {
          this.toggle_comm_log();
        }
        break;
      case "q":
        // To be fixed: 
        // auto mode also has effect on text speed
        if ( !cmm.require("adv_player")._isOpenedLog ) {
          this.toggle_auto();
        }
        break;
      case "e":
        if ( !cmm.require("adv_player")._isOpenedLog ) {
          this.toggle_hide();
        }
        break;
      case "d":
        if ( cmm.require("adv_player")._isOpenedLog ) {
          this.keyflags |= 0x1;
          this.log_scroll_factor = -1;
          // Potential issue: 
          // If one keyup then one keydown are triggered in a very short period 
          // (< the interval between two requestAnimationFrame() calls), 
          // there's a possibility to call second log_scroll() while 
          // the first one still hasn't jumped out of the loop, 
          // which means two requestAnimationFrame() will run simultaneously 
          // and thus the position will be updated twice faster
          if ( this.log_scrolling === false ) {
            this.log_scrolling = true;
            this.log_scroll();
          }
        } else {
          this.comm_forward();
        }
        break;
      case "a":
        if ( cmm.require("adv_player")._isOpenedLog ) {
          this.keyflags |= 0x2;
          this.log_scroll_factor = 1;
          if ( this.log_scrolling === false ) {
            this.log_scrolling = true;
            this.log_scroll();
          }
        } else {
          this.comm_backward();
        }
        break;
    }
  }, 

  handle_keyup: function(key) {
    switch (key) {
      case "d":
        this.keyflags &= ~0x1;
        if ( (this.keyflags & 0x2) > 0 ) {
          this.log_scroll_factor = 1;
        } else {
          this.log_scrolling = false;
        }
        break;
      case "a":
        this.keyflags &= ~0x2;
        if ( (this.keyflags & 0x1) > 0 ) {
          this.log_scroll_factor = -1;
        } else {
          this.log_scrolling = false;
        }
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
    const adv_player = cmm.require("adv_player");
    adv_player._isOpenedLog ? 
      cmm.require("log_close_button").emit("tap") :
      cmm.require("log_button").emit("tap");
  }, 

  toggle_auto: function() {
    const auto_button = cmm.require("auto_button");
    auto_button.emit("tap", { target: auto_button });
  }, 

  toggle_hide: function() {
    cmm.require("hide_button").emit("tap");
  }, 

  log_scroll: function() {
    const log_scroll_rect = cmm.require("log_scroll_rect");
    function scroll(e) {
      let t = 15 * this.log_scroll_factor;
      log_scroll_rect.updateContainerPos(log_scroll_rect._getDestinationPos(t));
      log_scroll_rect._checkBorder();
      if ( this.log_scrolling ) {
        window.requestAnimationFrame(scroll.bind(this));
      }
    }
    window.requestAnimationFrame(scroll.bind(this));
  }, 

  pin: function() {

  }, 

  comm_forward: function() {
    const adv_player = cmm.require("adv_player");
    if ( !adv_player._isOpenedLog ) {
      cmm.require("scenario_interaction_layer").emit("tap");
    }
  }, 

  comm_backward: function() {
    const p = cmm.require("adv_player");
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