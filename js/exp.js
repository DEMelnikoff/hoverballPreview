var exp = (function() {

    let p = {};

    let effort_url = jsPsych.data.getURLVariable("effort");
    let difficulty_url = jsPsych.data.getURLVariable("difficulty");


    // randomly assign to conditions and save settings
    const settings = {
        effort: effort_url ? effort_url : ['high', 'low'][Math.floor(Math.random()*2)],
        difficulty: difficulty_url ? difficulty_url : ['easy', 'hard'][Math.floor(Math.random()*2)],
        nRaces: 30,
        carSize: [40, 90],
        initPos: 50,
        trackWidth: 600,
        basePay: 2.20,
        firstTaskName: 'Hole in One',
    };

    if (settings.effort == 'high' && settings.difficulty == 'hard') {
        settings.correctAnswers = ['True', '50%'];
        settings.gravity = 3.5;
        settings.target_force = .052
        settings.slope = .00015;
    } else if (settings.effort == 'low' && settings.difficulty == 'hard') {
        settings.correctAnswers = ['True', '10%'];
        settings.gravity = 3.5;
        settings.target_force = .105
        settings.slope = .00015;
    } else if (settings.effort == 'high' && settings.difficulty == 'easy') {
        settings.correctAnswers = ['True', '90%'];
        settings.gravity = .5;
        settings.target_force = .0071
        settings.slope = .00035;
    } else if (settings.effort == 'low' && settings.difficulty == 'easy') {
        settings.correctAnswers = ['True', '50%'];
        settings.gravity = .5;
        settings.target_force = .014;
        settings.slope = .00035;
    };
    
    // save condition and URL data
    jsPsych.data.addProperties({
        effort: settings.effort,
        difficulty: settings.difficulty,
        basePay: settings.basePay,
        nRaces: settings.nRaces,
    });

    console.log(settings.difficulty, settings.effort);

   /*
    *
    *   INSTRUCTIONS
    *
    */

    function MakeSurveyIntro() {
        const info = {
            type: jsPsychInstructions,
            pages: [`<p><div class='parent' style='text-align: left'>For the next 10 to 15 minutes, you'll be helping us answer the following question:<br>
                "What makes some games more immersive and engaging than others?"</p>

                <p>Specifically, you'll play two games and provide feedback about each one. 
                By playing games and providing feedback, you'll help us understand how to design games 
                that are as immersive and engaging as possible.</p>

                <p>To make it easier for you to provide feedback, we will explain exactly what it means<br>
                for a game to be immersive and engaging. To continue, press "Next".</p></div>`,

                `<p><div class='parent' style='text-align: left'>A game that is immersive and engaging captures your attention and "sucks you in."</p>
                <p>When a game is extremely immersive and engaging, it can feel difficult to stop playing<br>
                even when you want to quit and do something else.</p></div>`],
            show_clickable_nav: true,
            post_trial_gap: 500,
        };
        const compChk = {
            type: jsPsychSurveyMultiChoice,
            questions: [
                {
                    prompt: `What does it mean for a game to be immersive and engaging?`,
                    name: `defineFlow`,
                    options: [`It means that I enjoyed the game.`, `It means that I won a lot of money by playing the game.`, `It means that the game captured my attention and sucked me in.`],
                    required: true,
                    horizontal: false,
                }],
            on_finish: (data) => {
                const correctAnswers = [`It means that the game captured my attention and sucked me in.`];
                const totalErrors = dmPsych.getTotalErrors(data, correctAnswers);
                data.totalErrors = totalErrors;
            }
        };
        const errorMessage = {
            type: jsPsychInstructions,
            pages: [`<div class='parent'><p>You provided a wrong answer.</p><p>To make sure you understand what makes a game immersive and engaging,<br>please continue to re-read the instructions.</p></div>`],
            show_clickable_nav: true,
        };
        const conditionalNode = {
            timeline: [errorMessage],
            conditional_function: (data) => {
                const fail = jsPsych.data.get().last(1).select('totalErrors').sum() > 0 ? true : false;
                return fail;
            }
        };
        this.timeline = [info, compChk, conditionalNode];
        this.loop_function = () => {
            const fail = jsPsych.data.get().last(2).select('totalErrors').sum() > 0 ? true : false;
            return fail;
        };
    };


    // create instruction nodes

    p.consent = {
        type: jsPsychExternalHtml,
        url: "./html/consent.html",
        cont_btn: "advance",
    };

    p.surveyIntro = new MakeSurveyIntro();

    p.intro_task1 = {
        type: jsPsychInstructions,
        pages: [`<div class='instructions'>
            <p>Next, you'll spend a few minutes playing the first of two games: a game called "Hover Ball."<br>
            After you finish, you'll answer some questions about your experience.</p>
            <p>When you're ready, press "Next" to continue.</p></div>`],
        show_clickable_nav: true,
    };

    p.intro_task2 = new dmPsych.intro_raceForPrize(settings);
    p.postPractice_task2 = new dmPsych.postPractice_raceForPrize(settings);

   /*
    *
    *   TASK
    *
    */

    p.task1 = {
        type: dmPsychHoleInOne,
        stimulus: dmPsych.float.run,
        total_shots: 12,  
        canvas_size: [475, 900],
        ball_color: 'white',
        ball_size: 16,
        target_size: 80,
        gravity: settings.gravity,
        target_force: settings.target_force,
        slope: settings.slope,
        prompt: `<div class='instructions' style='text-align:left; font-size: 16px; line-height: 18px; width: 900px'>

        <p><strong>Hover Ball</strong>. The goal of Hover Ball is to earn as many points as possible.</p>
        <p>Points are earned by tapping your spacebar. When you tap your spacebar, the ball will shoot upwards. The faster you tap, the higher the ball will go.
        If you tap your spacebar while the ball is in one of the colored zones, you'll earn points.</p>
        <p>The most valuable zone is red zone: it is worth 10 points. The blue zone is worth 3 points, the yellow zone is worth 2 points, and the green zone is worth 1 point.</p>
        <p>Now, try to earn as many points as possible! We'll let you know when time is up.</p></div>`,
        data: {block: 'holeInOne'}
    };

    const race_practice = {
        type: jsPsychRaceGame,
        prompt: settings.effort == 'high' ? "Practice accelerating by pressing the appropriate keys as fast as possible!" : "Practice accelerating by pressing the appropriate keys at just the right moment!",
        carSize: [40, 90],
        trackWidth: 600,
        initPos: 50,
        speed: 6,
        shift: settings.difficulty == 'hard' ? .35 : 0,
        maxSpeed: 14,
        boost: settings.effort == 'high' ? 1 : 3,
        data: {block: 'raceForPrize_practice'},
        keys: ["e", "i"],
        practice: true,
    };

    const outcome_practice = {
        type: jsPsychCanvasKeyboardResponse,
        canvas_size: [700, 900],
        stimulus: function(c) {
            return dmPsych.drawFireworks(c, 3000, 0, "Good job!\nGet ready for one more practice run.", [30, 30]);
        },
        choices: "NO_KEYS",
        trial_duration: jsPsych.timelineVariable('message_duration'),
        data: {block: 'raceForPrize_practice'},
    };

    p.task2_practice = {
        timeline: [race_practice, outcome_practice],
        repetitions: 1,
        timeline_variables: [
            { message_duration: 3000 },
            { message_duration: 0 },
        ],
    };

    let raceNum = 0;

    const race = {
        type: jsPsychRaceGame,
        prompt: "Win a fireworks display by beating your opponent!",
        carSize: [40, 90],
        trackWidth: 600,
        initPos: 50,
        speed: 6,
        shift: settings.difficulty == 'hard' ? .35 : 0,
        maxSpeed: 14,
        boost: settings.effort == 'high' ? 1 : 3,
        data: {block: 'raceForPrize', raceNum: raceNum},
        keys: ["e", "i"],
        practice: false,
    };

    const outcome = {
        type: jsPsychCanvasKeyboardResponse,
        canvas_size: [700, 900],
        stimulus: function(c) {
            let won = jsPsych.data.get().last(1).select('outcome').values[0];
            if (won) {
                return dmPsych.drawFireworks(c, 3000, 5, "You won!", [60]);
            } else {
                return dmPsych.drawFireworks(c, 3000, 0, "You lost!", [60]);
            }
        },
        choices: "NO_KEYS",
        trial_duration: 3000,
        data: {block: 'raceForPrize', raceNum: raceNum},
    };

    p.task2 = {
        timeline: [race, outcome],
        repetitions: settings.nRaces,
        on_timeline_start: () => {
            raceNum++;
        }
    };


   /*
    *
    *   QUESTIONS
    *
    */

    // scales
    var zeroToExtremely = ['0<br>A little', '1', '2', '3', '4', '5', '6', '7', '8<br>Extremely'];
    var zeroToALot = ['0<br>A little', '1', '2', '3', '4', '5', '6', '7', '8<br>A lot'];

    // constructor functions
    function MakeFlowQs(name, blockName) {
        this.type = jsPsychSurveyLikert;
        this.preamble = `<div style='padding-top: 50px; width: 850px; font-size:16px'>

        <p>Thank you for completing ${name}!</p>

        <p>During ${name}, to what extent did you feel immersed and engaged in what you were doing?<br>
        Report the degree to which you felt immersed and engaged by answering the following questions.</p></div>`;
        this.questions = [
            {
                prompt: `During ${name}, to what extent did you feel <strong>absorbed</strong> in what you were doing?`,
                name: `absorbed`,
                labels: zeroToExtremely,
                required: true,
            },
            {
                prompt: `During ${name}, to what extent did you feel <strong>immersed</strong> in what you were doing?`,
                name: `immersed`,
                labels: zeroToExtremely,
                required: true,
            },
            {
                prompt: `During ${name}, to what extent did you feel <strong>engaged</strong> in what you were doing?`,
                name: `engaged`,
                labels: zeroToExtremely,
                required: true,
            },
            {
                prompt: `During ${name}, to what extent did you feel <strong>engrossed</strong> in what you were doing?`,
                name: `engrossed`,
                labels: zeroToExtremely,
                required: true,
            },
        ];
        this.randomize_question_order = false;
        this.scale_width = 500;
        this.data = {block: blockName};
        this.on_finish =(data) => {
            dmPsych.saveSurveyData(data);
        };
    };

    function MakeEnjoyQs(name, blockName) {
        this.type = jsPsychSurveyLikert;
        this.preamble = `<div style='padding-top: 50px; width: 850px; font-size:16px'>

        <p>Below are a few more questions about the ${name}.</p>

        <p>Instead of asking about immersion and engagement, these questions ask about <strong>enjoyment</strong>.<br>
        Report how much you <strong>enjoyed</strong> ${name} by answering the following questions.</p></div>`;
        this.questions = [
            {
                prompt: `How much did you <strong>enjoy</strong> playing ${name}?`,
                name: `enjoyable`,
                labels: zeroToALot,
                required: true,
            },
            {
                prompt: `How much did you <strong>like</strong> playing ${name}?`,
                name: `like`,
                labels: zeroToALot,
                required: true,
            },
            {
                prompt: `How much did you <strong>dislike</strong> playing ${name}?`,
                name: `dislike`,
                labels: zeroToALot,
                required: true,
            },
            {
                prompt: `How much <strong>fun</strong> did you have playing ${name}?`,
                name: `fun`,
                labels: zeroToALot,
                required: true,
            },
            {
                prompt: `How <strong>entertaining</strong> was ${name}?`,
                name: `entertaining`,
                labels: zeroToExtremely,
                required: true,
            },
        ];
        this.randomize_question_order = false;
        this.scale_width = 500;
        this.data = {block: blockName};
        this.on_finish = (data) => {
            dmPsych.saveSurveyData(data);
        };
    };

    function MakeEffortQs(name, blockName) {
        this.type = jsPsychSurveyLikert;
        this.questions = [
            {
                prompt: `While playing ${name}, how much effort did it feel like you were exerting?`,
                name: `effort`,
                labels: zeroToALot,
                required: true,
            },
        ];
        this.randomize_question_order = false;
        this.scale_width = 500;
        this.data = {block: blockName};
        this.on_finish = (data) => {
            dmPsych.saveSurveyData(data);      
        };
    };
    
    p.task1_Qs = {
        timeline: [new MakeFlowQs('Hole in One', 'holeInOne'), new MakeEnjoyQs('Hole in One', 'holeInOne'), new MakeEffortQs('Hole in One', 'holeInOne')]
    };

    p.task2_Qs = {
        timeline: [new MakeFlowQs('Race for the Prize', 'raceForPrize'), new MakeEnjoyQs('Race for the Prize', 'raceForPrize'), new MakeEffortQs('Race for the Prize', 'raceForPrize')]
    };

    p.demographics = (function() {

        const demosIntro = {
            type: jsPsychInstructions,
            pages: [
                `<div class='parent'>
                    <p>Thank you for playing and evaluating our games!</p>
                    <p>Next, you will finish the study by completing a few final questions.</p>
                </div>`
            ],
            show_clickable_nav: true,
        };

        const meanOfEffScale = ['-2<br>Strongly<br>Disagree', '-1<br>Disagree', '0<br>Neither agree<br>nor disagree', '1<br>Agree', '2<br>Strongly<br>Agree'];

        const meanOfEff = {
            type: jsPsychSurveyLikert,
            preamble:
                `<div style='padding-top: 50px; width: 900px; font-size:16px'>
                    <p>Please answer the following questions as honestly and accurately as possible.</p>
                </div>`,
            questions: [
                {
                    prompt: `Pushing myself helps me see the bigger picture.`,
                    name: `meanOfEff_1`,
                    labels: meanOfEffScale,
                    required: true,
                },
                {
                    prompt: `I often don't understand why I am working so hard.`,
                    name: `meanOfEff_2r`,
                    labels: meanOfEffScale,
                    required: true,
                },
                {
                    prompt: `I learn the most about myself when I am trying my hardest.`,
                    name: `meanOfEff_3`,
                    labels: meanOfEffScale,
                    required: true,
                },
                {
                    prompt: `Things make more sense when I can put my all into them.`,
                    name: `meanOfEff_4`,
                    labels: meanOfEffScale,
                    required: true,
                },
                {
                    prompt: `When I work hard, it rarely makes a difference.`,
                    name: `meanOfEff_5r`,
                    labels: meanOfEffScale,
                    required: true,
                },
                {
                    prompt: `When I push myself, what I'm doing feels important.`,
                    name: `meanOfEff_6`,
                    labels: meanOfEffScale,
                    required: true,
                },
                {
                    prompt: `When I push myself, I feel like I'm part of something bigger than me.`,
                    name: `meanOfEff_7`,
                    labels: meanOfEffScale,
                    required: true,
                },
                {
                    prompt: `Doing my best gives me a clear purpose in life.`,
                    name: `meanOfEff_8`,
                    labels: meanOfEffScale,
                    required: true,
                },
                {
                    prompt: `When I try my hardest, my life has meaning.`,
                    name: `meanOfEff_9`,
                    labels: meanOfEffScale,
                    required: true,
                },
                {
                    prompt: `When I exert myself, I feel connected to my ideal life.`,
                    name: `meanOfEff_10`,
                    labels: meanOfEffScale,
                    required: true,
                },
            ],
            randomize_question_order: false,
            scale_width: 500,
            on_finish: (data) => {
                dmPsych.saveSurveyData(data); 
            },
        };

        const gender = {
            type: jsPsychHtmlButtonResponse,
            stimulus: '<p>What is your gender?</p>',
            choices: ['Male', 'Female', 'Other'],
            on_finish: (data) => {
                data.gender = data.response;
            }
        };

        const age = {
            type: jsPsychSurveyText,
            questions: [
                {
                    prompt: "Age:", 
                    name: "age",
                    required: true,
                }
            ],
            on_finish: (data) => {
                dmPsych.saveSurveyData(data); 
            },
        }; 

        const ethnicity = {
            type: jsPsychSurveyHtmlForm,
            preamble: '<p>What is your race / ethnicity?</p>',
            html: `<div style="text-align: left">
            <p>White / Caucasian <input name="ethnicity" type="radio" value="white"/></p>
            <p>Black / African American <input name="ethnicity" type="radio" value="black"/></p>
            <p>East Asian (e.g., Chinese, Korean, Vietnamese, etc.) <input name="ethnicity" type="radio" value="east-asian"/></p>
            <p>South Asian (e.g., Indian, Pakistani, Sri Lankan, etc.) <input name="ethnicity" type="radio" value="south-asian"/></p>
            <p>Latino / Hispanic <input name="ethnicity" type="radio" value="hispanic"/></p>
            <p>Middle Eastern / North African <input name="ethnicity" type="radio" value="middle-eastern"/></p>
            <p>Indigenous / First Nations <input name="ethnicity" type="radio" value="indigenous"/></p>
            <p>Bi-racial <input name="ethnicity" type="radio" value="indigenous"/></p>
            <p>Other <input name="other" type="text"/></p>
            </div>`,
            on_finish: (data) => {
                data.ethnicity = data.response.ethnicity;
                data.other = data.response.other;
            }
        };

        const english = {
            type: jsPsychHtmlButtonResponse,
            stimulus: '<p>Is English your native language?:</p>',
            choices: ['Yes', 'No'],
            on_finish: (data) => {
                data.english = data.response;
            }
        };  

        const finalWord = {
            type: jsPsychSurveyText,
            questions: [{prompt: "Questions? Comments? Complains? Provide your feedback here!", rows: 10, columns: 100, name: "finalWord"}],
            on_finish: (data) => {
                dmPsych.saveSurveyData(data); 
            },
        }; 


        const demos = {
            timeline: [demosIntro, meanOfEff, gender, age, ethnicity, english, finalWord]
        };

        return demos;

    }());

   /*
    *
    *  END TASK
    *
    */


    p.save_data = {
        type: jsPsychPipe,
        action: "save",
        experiment_id: "GAu2pFkQf2gy",
        filename: dmPsych.filename,
        data_string: ()=>jsPsych.data.get().csv()
    };

    return p;

}());

const timeline = [exp.task1];

// initiate timeline
jsPsych.run(timeline);
