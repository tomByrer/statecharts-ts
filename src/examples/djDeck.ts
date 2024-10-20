import { machineFactory } from '../machineFactory';

type Context = {
  currentTrack: {
    deckA: null | string;
    deckB: null | string;
  };
  cuePoints: {
    deckA: null | number;
    deckB: null | number;
  };
  volume: {
    deckA: number;
    deckB: number;
  };
};

const djDeck = machineFactory<Context>({
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
              if (event.data?.trackName) {
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
                  if (event.data?.cuePoint) {
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
                  if (typeof event.data?.volume === 'number') {
                    context.volume.deckA = event.data.volume;
                  }
                },
                FADE_VOLUME: ({ event, context }) => {
                  if (
                    typeof event.data?.targetVolume === 'number' &&
                    typeof event.data?.duration === 'number'
                  ) {
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
              if (event.data?.trackName) {
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
                  if (event.data?.cuePoint) {
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
                  if (typeof event.data?.volume === 'number') {
                    context.volume.deckB = event.data.volume;
                  }
                },
                FADE_VOLUME: ({ event, context }) => {
                  if (
                    typeof event.data?.targetVolume === 'number' &&
                    typeof event.data?.duration === 'number'
                  ) {
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
  events: {} as
    | { type: 'LOAD_CD'; data: { trackName: string } }
    | { type: 'SET_CUE'; data: { cuePoint: number } }
    | { type: 'LISTEN_CUE' }
    | { type: 'START_PLAYBACK' }
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'STOP' }
    | { type: 'SET_VOLUME'; data: { volume: number } }
    | { type: 'FADE_VOLUME'; data: { targetVolume: number; duration: number } },
});

// Example usage:
const unsubscribe = djDeck.subscribe((state, context) => {
  console.log('Current State:', state);
  console.log('Context:', context);
});

// Load tracks
djDeck.send({ type: 'LOAD_CD', data: { trackName: 'Track 1' } }); // Affects Deck A
djDeck.send({ type: 'LOAD_CD', data: { trackName: 'Track 2' } }); // Affects Deck B

// Set cue points
djDeck.send({ type: 'SET_CUE', data: { cuePoint: 30 } }); // Sets cue point for Deck A
djDeck.send({ type: 'SET_CUE', data: { cuePoint: 45 } }); // Sets cue point for Deck B

// Start playback
djDeck.send({ type: 'START_PLAYBACK' }); // Starts playback on both decks

// Adjust volume
djDeck.send({ type: 'SET_VOLUME', data: { volume: 80 } }); // Sets volume for Deck A to 80

// Fade volume
djDeck.send({
  type: 'FADE_VOLUME',
  data: { targetVolume: 50, duration: 3000 },
}); // Fades volume for Deck A to 50 over 3000ms

unsubscribe();

export default djDeck;
