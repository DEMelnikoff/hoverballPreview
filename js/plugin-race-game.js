var jsPsychRaceGame = (function (jspsych) {
  'use strict';

  const info = {
      name: "race-game",
      parameters: {
          /**
           * Array containing the key(s) the subject must press to accelerate the car.
           */
          keys: {
              type: jspsych.ParameterType.KEYS,
              pretty_name: "Keys",
              default: "ALL_KEYS",
          },
          /**
           * Speed of car.
           */
          speed: {
              type: jspsych.ParameterType.INT,
              pretty_name: "Speed",
              default: null,
          },
          /**
           * Maximum speed of car.
           */ 
          maxSpeed: {
              type: jspsych.ParameterType.INT,
              pretty_name: "Max Speed",
              default: null,
          },
          /**
           * Maximum speed of car.
           */ 
          boost: {
              type: jspsych.ParameterType.INT,
              pretty_name: "boost",
              default: null,
          },
          /**
           * Array containing the key(s) the subject must press to accelerate the car.
           */
          carSize: {
              type: jspsych.ParameterType.INT,
              pretty_name: "Car Size",
              default: null,
          },
          /**
           * Starting position of car (distance from left edge of track) in pixels.
           */
          initPos: {
              type: jspsych.ParameterType.INT,
              pretty_name: "Initial Position",
              default: null,
          },
          /**
           * Width of track in pixels.
           */
          trackWidth: {
              type: jspsych.ParameterType.INT,
              pretty_name: "Track Width",
              default: null,
          },
          /**
           * This value is subtracted from the output of the logistic function to compute the probability of the opponent accelerating.
           */
          shift: {
              type: jspsych.ParameterType.FLOAT,
              pretty_name: "Shift",
              default: null,
          },
          /**
           * Any content here will be displayed above the stimulus.
           */
          prompt: {
              type: jspsych.ParameterType.HTML_STRING,
              pretty_name: "Prompt",
              default: null,
          },
          /**
           * Whether or not it is a practice session.
           */
          practice: {
              type: jspsych.ParameterType.BOOL,
              pretty_name: "Practice",
              default: false,
          },
      },
  };
  /**
   * **html-keyboard-response**
   *
   * jsPsych plugin for displaying a stimulus and getting a keyboard response
   *
   * @author Josh de Leeuw
   * @see {@link https://www.jspsych.org/plugins/jspsych-html-keyboard-response/ html-keyboard-response plugin documentation on jspsych.org}
   */
  class RaceGamePlugin {
      constructor(jsPsych) {
          this.jsPsych = jsPsych;
      }
      trial(display_element, trial) {

          let oppWidth = trial.practice ? 0 : trial.carSize[1];
          let oppHeight = trial.practice ? 0 : trial.carSize[0];
          let distFromTop = trial.practice ? (250 - trial.carSize[0]) / 2 : 50;

          var new_html = 
          `<div style="position:relative; left: 0; right: 0; width: ${trial.trackWidth}px; height: 100px; margin:auto">
              <p style="font-size:25px">${trial.prompt}</p>
          </div>

          <div style="position:relative; left: 0; right: 0; width: ${trial.trackWidth}px; height: 250px; margin:auto; background: #D3D3D3">
            <div id="myCar" style="position:absolute; top:${distFromTop}px; left:${trial.initPos}px">
              <img src="img/myCar.png" style="height:${trial.carSize[0]}px; width:${trial.carSize[1]}px"></img>
            </div>
            <div id="opponent" style="position:absolute; top:${250-trial.carSize[0]-50}px; left:${trial.initPos}px">
              <img src="img/theirCar.png" style="height:${oppHeight}px; width:${oppWidth}px"></img>
            </div>
            <div style="position:absolute; left:${trial.trackWidth-trial.initPos}px; height: 100%; width:5px; background:black">
            </div>

            <div style="position:absolute; top:75px; left:-80px">
              <p id="left-button" style="height:100px; width:50px; background:#b0fc38; border-style:solid; border-width:3px; border-color:black; display:table-cell; vertical-align:middle; margin-left:auto; font-size: 40px; margin-right:auto">${trial.keys[0].toUpperCase()}</p>
            </div>

            <div style="position:absolute; top:75px; width: 50px; left:630px">
              <p id="right-button" style="height:100px; width:50px; background:white; border-style:solid; border-width:3px; border-color:black; display:table-cell; vertical-align:middle; margin-left:auto; font-size: 40px; margin-right:auto">${trial.keys[1].toUpperCase()}</p>
            </div>

          </div>`

          // draw
          display_element.innerHTML = new_html;

          // get perturbation points
          const totalDist = trial.trackWidth - trial.carSize[1] - (2*trial.initPos) - 5;
          const distBtwnPerturbs = totalDist / 3;
          const perturbWeights = [1, 1, 1];
          let perturbLocs = [];
          for (let i = 0; i < 3; i++) {
            let gap = Math.floor(Math.random() * (distBtwnPerturbs / 2) + (distBtwnPerturbs / 2))
            if (i == 0) { 
              perturbLocs.push(gap + trial.initPos + trial.carSize[0]) 
            } else {
              perturbLocs.push(gap + perturbLocs[i - 1]) 
            };
          }

          let pressRight = 0;
          let nPresses = 0;
          let myPos = trial.initPos;
          let myLastPos = myPos;
          let theirPos = trial.initPos;
          let myCar = document.getElementById("myCar");
          let theirCar = document.getElementById("opponent");
          let leftButton = document.getElementById("left-button");
          let rightButton = document.getElementById("right-button");
          let loadTime = performance.now();
          let startTime = 0;
          let pWin;
          let win;
          let tArray = [];
          let ipr = 0;
          let delay = trial.boost == 1 ? (1000/60) : 250;
          let nPerturb = 0;
          let theirSpeed = 0;
          let iprAdjusted;

          const vroom = function() {
            tArray.push(performance.now());
            if (tArray.length > 10) { tArray.shift() };
            if (tArray.length > 1) {
              ipr = (tArray.length - 1) * 1000 / (tArray[tArray.length - 1] - tArray[0]);
            };
            iprAdjusted = ipr * trial.boost;
            myPos = Math.ceil(myPos + trial.speed * trial.boost * Math.min(1, trial.maxSpeed/iprAdjusted));
            myCar.style.left = myPos + "px";
          };

          const checkeredFlag = function() {
             if (theirPos + trial.carSize[1] > trial.trackWidth - trial.initPos || myPos + trial.carSize[1] > trial.trackWidth - trial.initPos) {
              myPos >= theirPos ? win = 1 : win = 0;
              end_trial();
            };
          }

          const checkForWin = setInterval(checkeredFlag, 1000/60);

          // function for moving own car
          const moveMe_func = function(event) {
            if (nPresses == 0) { startTime = performance.now() };
            nPresses++;

            let key = event.key;
            if (key == trial.keys[0] && pressRight == 0) {
              vroom();
              leftButton.style.background = "white";
              pressRight = null;
              setTimeout(() => {
                rightButton.style.background = "#b0fc38";
                pressRight = 1;
              }, delay)
            } else if (key == trial.keys[1] && pressRight == 1) {
              vroom();
              rightButton.style.background = "white";
              pressRight = null;
              setTimeout(() => {
                leftButton.style.background = "#b0fc38";
                pressRight = 0;
              }, delay)
            };

            myCar = document.getElementById("myCar");
          };
          
          // listen for keypress
          document.addEventListener("keydown", moveMe_func);

          // function for moving opponent's car
          const moveThem_func = function() {

            let theirSpeed =  myPos - myLastPos;
            if (nPresses == 0) { theirSpeed = 0 }
            if (nPresses == 1) { theirSpeed = parseInt(myCar.style.left) - trial.initPos };
        
            let perturb = 0;
            if (nPerturb < perturbLocs.length) {
              if (myPos >= perturbLocs[nPerturb]) {
                if (nPerturb == 0) {
                  pWin = dmPsych.logit(Math.min(trial.maxSpeed/trial.boost, ipr), .3, 3, trial.shift);
                  win = (Math.random() < pWin) ? -1 : 1;
                };
                perturb = trial.speed * perturbWeights[nPerturb] * 2 * win;
                if (nPerturb == 1) { perturb = perturb + (theirSpeed/2) };
                nPerturb++;
                console.log(pWin, win);
              };
            };

            theirPos = theirPos + perturb + theirSpeed;
            theirCar.style.left = theirPos + "px";
            myLastPos = myPos;

          };

          const moveThem = trial.practice ? null : setInterval(moveThem_func, 600);


          // function to end trial when it is time
          const end_trial = () => {
              // kill any remaining setTimeout handlers
              document.removeEventListener("keydown", moveMe_func);
              clearInterval(moveThem);
              clearInterval(checkForWin);
              this.jsPsych.pluginAPI.clearAllTimeouts();
              // kill keyboard listeners
              if (typeof keyboardListener !== "undefined") {
                  this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
              }
              // gather the data to store for the trial
              var trial_data = {
                  rt: performance.now() - loadTime,
                  playTime: performance.now() - startTime,
                  nPresses: nPresses,
                  myPos: myPos,
                  theirPos: theirPos,
                  outcome: win,
              };
              // clear the display
              display_element.innerHTML = "";
              // move on to the next trial
              this.jsPsych.finishTrial(trial_data);
          };
          // function to handle responses by the subject
          var after_response = (info) => {
              // after a valid response, the stimulus will have the CSS class 'responded'
              // which can be used to provide visual feedback that a response was recorded
              display_element.querySelector("#jspsych-html-keyboard-response-stimulus").className +=
                  " responded";
              // only record the first response
              if (response.key == null) {
                  response = info;
              }
              if (trial.response_ends_trial) {
                  end_trial();
              }
          };
      }
      simulate(trial, simulation_mode, simulation_options, load_callback) {
          if (simulation_mode == "data-only") {
              load_callback();
              this.simulate_data_only(trial, simulation_options);
          }
          if (simulation_mode == "visual") {
              this.simulate_visual(trial, simulation_options, load_callback);
          }
      }
      create_simulation_data(trial, simulation_options) {
          const default_data = {
              stimulus: trial.stimulus,
              rt: this.jsPsych.randomization.sampleExGaussian(500, 50, 1 / 150, true),
              response: this.jsPsych.pluginAPI.getValidKey(trial.choices),
          };
          const data = this.jsPsych.pluginAPI.mergeSimulationData(default_data, simulation_options);
          this.jsPsych.pluginAPI.ensureSimulationDataConsistency(trial, data);
          return data;
      }
      simulate_data_only(trial, simulation_options) {
          const data = this.create_simulation_data(trial, simulation_options);
          this.jsPsych.finishTrial(data);
      }
      simulate_visual(trial, simulation_options, load_callback) {
          const data = this.create_simulation_data(trial, simulation_options);
          const display_element = this.jsPsych.getDisplayElement();
          this.trial(display_element, trial);
          load_callback();
          if (data.rt !== null) {
              this.jsPsych.pluginAPI.pressKey(data.response, data.rt);
          }
      }
  }
  RaceGamePlugin.info = info;

  return RaceGamePlugin;

})(jsPsychModule);
