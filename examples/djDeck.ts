import chalk from 'chalk';
import { machineFactory } from '../machineFactory';

const context = {
  currentTrack: {
    deckA: null as string | null,
    deckB: null as string | null,
  },
  cuePoints: {
    deckA: null as number | null,
    deckB: null as number | null,
  },
  volume: {
    deckA: 100, // Default volume is 100
    deckB: 100, // Default volume is 100
  },
};

const djDeck = machineFactory({
  parallel: true,
  states: {
    deckA: {
      states: {
        loading: {
          on: {
            LOAD_CD: ({ event }) => {
              if (event.data?.trackName) {
                context.currentTrack.deckA = event.data.trackName;

                console.log(
                  chalk.green(
                    `Loaded track on Deck A: ${event.data.trackName}`,
                  ),
                );

                return 'cueing';
              }
            },
          },
        },
        cueing: {
          states: {
            cueSet: {
              on: {
                LISTEN_CUE: () => {
                  console.log(chalk.blue('Listening to cue on Deck A'));

                  return 'cueing';
                },
                START_PLAYBACK: () => {
                  console.log(chalk.blue('Starting playback on Deck A'));

                  return 'playing';
                },
              },
            },
            cueing: {
              initial: true,
              on: {
                SET_CUE: ({ event }) => {
                  if (event.data?.cuePoint) {
                    context.cuePoints.deckA = event.data.cuePoint;

                    console.log(
                      chalk.yellow(
                        `Set cue point on Deck A: ${event.data.cuePoint}`,
                      ),
                    );

                    return 'cueSet';
                  }
                },
                START_PLAYBACK: () => {
                  console.log(chalk.blue('Starting playback on Deck A'));

                  return 'playing';
                },
              },
            },
          },
        },
        playing: {
          states: {
            trackPlaying: {
              initial: true,
              on: {
                PAUSE: () => {
                  console.log(chalk.red('Pausing track on Deck A'));

                  return 'trackPaused';
                },
                STOP: () => {
                  console.log(chalk.red('Stopping track on Deck A'));

                  return 'loading';
                },
                SET_VOLUME: ({ event }) => {
                  if (typeof event.data?.volume === 'number') {
                    context.volume.deckA = event.data.volume;

                    console.log(
                      chalk.green(`Set volume on Deck A: ${event.data.volume}`),
                    );
                  }
                },
                FADE_VOLUME: ({ event }) => {
                  if (
                    typeof event.data?.targetVolume === 'number' &&
                    typeof event.data?.duration === 'number'
                  ) {
                    // Simulate volume fade logic
                    context.volume.deckA = event.data.targetVolume;

                    console.log(
                      chalk.green(
                        `Fading volume on Deck A to: ${event.data.targetVolume} over ${event.data.duration}ms`,
                      ),
                    );
                  }
                },
              },
            },
            trackPaused: {
              on: {
                RESUME: () => {
                  console.log(chalk.blue('Resuming track on Deck A'));
                  return 'trackPlaying';
                },
                STOP: () => {
                  console.log(chalk.red('Stopping track on Deck A'));
                  return 'loading';
                },
              },
            },
          },
        },
      },
    },
    deckB: {
      states: {
        loading: {
          on: {
            LOAD_CD: ({ event }) => {
              if (event.data?.trackName) {
                context.currentTrack.deckB = event.data.trackName;

                console.log(
                  chalk.green(
                    `Loaded track on Deck B: ${event.data.trackName}`,
                  ),
                );
                return 'cueing';
              }
            },
          },
        },
        cueing: {
          states: {
            cueSet: {
              on: {
                LISTEN_CUE: () => {
                  console.log(chalk.blue('Listening to cue on Deck B'));

                  return 'cueing';
                },
                START_PLAYBACK: () => {
                  console.log(chalk.blue('Starting playback on Deck B'));

                  return 'playing';
                },
              },
            },
            cueing: {
              initial: true,
              on: {
                SET_CUE: ({ event }) => {
                  if (event.data?.cuePoint) {
                    context.cuePoints.deckB = event.data.cuePoint;

                    console.log(
                      chalk.yellow(
                        `Set cue point on Deck B: ${event.data.cuePoint}`,
                      ),
                    );

                    return 'cueSet';
                  }
                },
                START_PLAYBACK: () => {
                  console.log(chalk.blue('Starting playback on Deck B'));

                  return 'playing';
                },
              },
            },
          },
        },
        playing: {
          states: {
            trackPlaying: {
              initial: true,
              on: {
                PAUSE: () => {
                  console.log(chalk.red('Pausing track on Deck B'));

                  return 'trackPaused';
                },
                STOP: () => {
                  console.log(chalk.red('Stopping track on Deck B'));

                  return 'loading';
                },
                SET_VOLUME: ({ event }) => {
                  if (typeof event.data?.volume === 'number') {
                    context.volume.deckB = event.data.volume;

                    console.log(
                      chalk.green(`Set volume on Deck B: ${event.data.volume}`),
                    );
                  }
                },
                FADE_VOLUME: ({ event }) => {
                  if (
                    typeof event.data?.targetVolume === 'number' &&
                    typeof event.data?.duration === 'number'
                  ) {
                    // Simulate volume fade logic
                    context.volume.deckB = event.data.targetVolume;

                    console.log(
                      chalk.green(
                        `Fading volume on Deck B to: ${event.data.targetVolume} over ${event.data.duration}ms`,
                      ),
                    );
                  }
                },
              },
            },
            trackPaused: {
              on: {
                RESUME: () => {
                  console.log(chalk.blue('Resuming track on Deck B'));

                  return 'trackPlaying';
                },
                STOP: () => {
                  console.log(chalk.red('Stopping track on Deck B'));

                  return 'loading';
                },
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
const unsubscribe = djDeck.subscribe((state) => {
  console.log(chalk.magenta('Current State:'), state);
  console.log(chalk.magenta('Context:'), context);
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
