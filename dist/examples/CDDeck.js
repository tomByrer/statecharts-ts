"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const machineFactory_1 = require("../machineFactory");
const cdDeckMachine = (0, machineFactory_1.machineFactory)({
    type: 'parallel',
    context: {
        currentTrack: {
            deckA: null,
            deckB: null,
        },
        cuePoints: {
            deckA: null,
            deckB: null,
        },
        volume: {
            deckA: 100, // Default volume is 100
            deckB: 100, // Default volume is 100
        },
    },
    states: {
        deckA: {
            type: 'sequential',
            states: {
                loading: {
                    on: {
                        LOAD_CD: ({ transition, event, context }) => {
                            var _a;
                            if ((_a = event.data) === null || _a === void 0 ? void 0 : _a.trackName) {
                                context.currentTrack.deckA = event.data.trackName;
                                transition('cueing');
                            }
                        },
                    },
                },
                cueing: {
                    type: 'sequential',
                    states: {
                        cueSet: {
                            on: {
                                LISTEN_CUE: ({ transition }) => transition('cueing'),
                                START_PLAYBACK: ({ transition }) => transition('playing'),
                            },
                        },
                        cueing: {
                            type: 'initial',
                            on: {
                                SET_CUE: ({ transition, event, context }) => {
                                    var _a;
                                    if ((_a = event.data) === null || _a === void 0 ? void 0 : _a.cuePoint) {
                                        context.cuePoints.deckA = event.data.cuePoint;
                                        transition('cueSet');
                                    }
                                },
                                START_PLAYBACK: ({ transition }) => transition('playing'),
                            },
                        },
                    },
                },
                playing: {
                    type: 'sequential',
                    states: {
                        trackPlaying: {
                            type: 'initial',
                            on: {
                                PAUSE: ({ transition }) => transition('trackPaused'),
                                STOP: ({ transition }) => transition('loading'),
                                SET_VOLUME: ({ event, context }) => {
                                    var _a;
                                    if (typeof ((_a = event.data) === null || _a === void 0 ? void 0 : _a.volume) === 'number') {
                                        context.volume.deckA = event.data.volume;
                                    }
                                },
                                FADE_VOLUME: ({ event, context }) => {
                                    var _a, _b;
                                    if (typeof ((_a = event.data) === null || _a === void 0 ? void 0 : _a.targetVolume) === 'number' &&
                                        typeof ((_b = event.data) === null || _b === void 0 ? void 0 : _b.duration) === 'number') {
                                        // Simulate volume fade logic
                                        context.volume.deckA = event.data.targetVolume;
                                    }
                                },
                            },
                        },
                        trackPaused: {
                            on: {
                                RESUME: ({ transition }) => transition('trackPlaying'),
                                STOP: ({ transition }) => transition('loading'),
                            },
                        },
                    },
                },
            },
        },
        deckB: {
            type: 'sequential',
            states: {
                loading: {
                    on: {
                        LOAD_CD: ({ transition, event, context }) => {
                            var _a;
                            if ((_a = event.data) === null || _a === void 0 ? void 0 : _a.trackName) {
                                context.currentTrack.deckB = event.data.trackName;
                                transition('cueing');
                            }
                        },
                    },
                },
                cueing: {
                    type: 'sequential',
                    states: {
                        cueSet: {
                            on: {
                                LISTEN_CUE: ({ transition }) => transition('cueing'),
                                START_PLAYBACK: ({ transition }) => transition('playing'),
                            },
                        },
                        cueing: {
                            type: 'initial',
                            on: {
                                SET_CUE: ({ transition, event, context }) => {
                                    var _a;
                                    if ((_a = event.data) === null || _a === void 0 ? void 0 : _a.cuePoint) {
                                        context.cuePoints.deckB = event.data.cuePoint;
                                        transition('cueSet');
                                    }
                                },
                                START_PLAYBACK: ({ transition }) => transition('playing'),
                            },
                        },
                    },
                },
                playing: {
                    type: 'sequential',
                    states: {
                        trackPlaying: {
                            type: 'initial',
                            on: {
                                PAUSE: ({ transition }) => transition('trackPaused'),
                                STOP: ({ transition }) => transition('loading'),
                                SET_VOLUME: ({ event, context }) => {
                                    var _a;
                                    if (typeof ((_a = event.data) === null || _a === void 0 ? void 0 : _a.volume) === 'number') {
                                        context.volume.deckB = event.data.volume;
                                    }
                                },
                                FADE_VOLUME: ({ event, context }) => {
                                    var _a, _b;
                                    if (typeof ((_a = event.data) === null || _a === void 0 ? void 0 : _a.targetVolume) === 'number' &&
                                        typeof ((_b = event.data) === null || _b === void 0 ? void 0 : _b.duration) === 'number') {
                                        // Simulate volume fade logic
                                        context.volume.deckB = event.data.targetVolume;
                                    }
                                },
                            },
                        },
                        trackPaused: {
                            on: {
                                RESUME: ({ transition }) => transition('trackPlaying'),
                                STOP: ({ transition }) => transition('loading'),
                            },
                        },
                    },
                },
            },
        },
    },
    events: {},
});
// Example usage:
const unsubscribe = cdDeckMachine.subscribe((state, context) => {
    console.log('Current State:', state);
    console.log('Context:', context);
});
// Load tracks
cdDeckMachine.send({ type: 'LOAD_CD', data: { trackName: 'Track 1' } }); // Affects Deck A
cdDeckMachine.send({ type: 'LOAD_CD', data: { trackName: 'Track 2' } }); // Affects Deck B
// Set cue points
cdDeckMachine.send({ type: 'SET_CUE', data: { cuePoint: 30 } }); // Sets cue point for Deck A
cdDeckMachine.send({ type: 'SET_CUE', data: { cuePoint: 45 } }); // Sets cue point for Deck B
// Start playback
cdDeckMachine.send({ type: 'START_PLAYBACK' }); // Starts playback on both decks
// Adjust volume
cdDeckMachine.send({ type: 'SET_VOLUME', data: { volume: 80 } }); // Sets volume for Deck A to 80
// Fade volume
cdDeckMachine.send({
    type: 'FADE_VOLUME',
    data: { targetVolume: 50, duration: 3000 },
}); // Fades volume for Deck A to 50 over 3000ms
unsubscribe();
exports.default = cdDeckMachine;
//# sourceMappingURL=CDDeck.js.map