// examples/token.ts
import { machineFactory } from '../src';
import { invariant } from '../src/lib';

function generateFakeGUID() {
  const hexDigits = '0123456789abcdef';
  const segments = [8, 4, 4, 4, 12];
  const fakeGUID = segments
    .map((segment) => {
      let segmentStr = '';
      for (let i = 0; i < segment; i++) {
        segmentStr += hexDigits[Math.floor(Math.random() * hexDigits.length)];
      }
      return segmentStr;
    })
    .join('-');

  return fakeGUID;
}

async function mockFetchToken(credentials: {
  username: string;
  password: string;
}) {
  invariant(credentials.username, 'Invalid username');
  invariant(credentials.password, 'Invalid password');

  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    accessToken: generateFakeGUID(),
    refreshToken: generateFakeGUID(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24,
  };
}

async function mockRefreshToken(refreshToken: string) {
  invariant(refreshToken, 'Invalid refresh token');

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    accessToken: generateFakeGUID(),
    refreshToken: generateFakeGUID(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24,
  };
}

type Events =
  | { type: 'AUTHENTICATE'; data: { username: string; password: string } }
  | { type: 'FETCH_RESPONSE' }
  | { type: 'REFRESH_TOKEN' }
  | { type: 'REFRESH_ERROR' };

type Context = {
  token: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  } | null;
  attempts: number;
};

const machine = machineFactory<Events, Context>({
  events: {} as Events,
  context: {
    token: null,
    attempts: 0,
  },
  states: {
    unauthenticated: {
      states: {
        idle: {
          initial: true,
          on: {
            AUTHENTICATE: () => 'fetchingToken',
          },
        },
        fetchingToken: {
          onEntry: async ({ event, setContext }) => {
            setContext(() => ({ token: null, attempts: 0 }));

            invariant(event.type === 'AUTHENTICATE', 'Invalid event type');

            const { username, password } = event.data;

            try {
              setContext(({ attempts }) => ({
                token: null,
                attempts: attempts + 1,
              }));

              const { accessToken, refreshToken, expiresAt } =
                await mockFetchToken({ username, password });

              setContext({
                token: {
                  accessToken,
                  refreshToken,
                  expiresAt,
                },
                attempts: 0,
              });

              return 'authenticated';
            } catch {
              return 'fetchingTokenError';
            }
          },
        },
        fetchingTokenError: {
          onEntry: ({ after }) => {
            after(1000, () => {
              return 'idle';
            });
          },
        },
      },
    },
    authenticated: {
      states: {
        waitForExpiration: {
          initial: true,
          onEntry: ({ after, context }) => {
            invariant(context.token, 'Invalid context');

            after(context.token.expiresAt - Date.now(), () => {
              return 'refreshingToken';
            });
          },
        },
        refreshingToken: {
          onEntry: async ({ event, setContext, context }) => {
            invariant(event.type === 'REFRESH_TOKEN', 'Invalid event type');
            invariant(context.token, 'Invalid context');

            try {
              const { accessToken, refreshToken, expiresAt } =
                await mockRefreshToken(context.token.refreshToken);

              setContext({
                token: { accessToken, refreshToken, expiresAt },
                attempts: 0,
              });

              return 'waitForExpiration';
            } catch {
              return 'refreshingTokenError';
            }
          },
        },
        refreshingTokenError: {
          onEntry: ({ after }) => {
            after(1000, () => {
              return 'refreshingToken';
            });
          },
        },
      },
    },
  },
} as const);

machine.subscribe((state) => {
  console.log('Current state:', state);
});

machine.start();
