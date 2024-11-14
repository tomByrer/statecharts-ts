const config = {
  states: {
    alpha: {
      states: {
        alpha1: {
          states: {
            alpha1a: {
              states: {
                alpha1a1: {},
                alpha1a2: {},
              },
            },
            alpha1b: {
              states: {
                alpha1b1: {},
                alpha1b2: {},
              },
            },
          },
        },
        alpha2: {
          states: {
            alpha2a: {
              states: {
                alpha2a1: {},
                alpha2a2: {},
              },
            },
            alpha2b: {
              states: {
                alpha2b1: {},
                alpha2b2: {},
              },
            },
          },
        },
      },
      beta: {},
      gamma: {},
    },
  },
};

type NestedStates3<T> = T extends { states: infer U }
  ? U extends Record<string, any>
    ? {
        [K in keyof U]: K | `${K}/${keyof U & string}`;
      }[keyof U]
    : never
  : never;

type OneOrTwoLevelPaths<T> =
  T extends Record<string, any>
    ? {
        [K in keyof T]: K | `${K}/${NestedStates2<T[K]>}`;
      }[keyof T]
    : never;

// Usage example with the provided config object
type TwoLevelPaths = OneOrTwoLevelPaths<(typeof config)['states']>;

// Resulting type will be:
// "alpha" |
// "alpha/alpha1" |
// "alpha/alpha2" |
// "alpha/beta" |
// "alpha/gamma" |
// "alpha1/alpha1a" |
// "alpha1/alpha1b" |
// "alpha2/alpha2a" |
// "alpha2/alpha2b" |
// "alpha1a/alpha1a1" |
// "alpha1a/alpha1a2" |
// "alpha1b/alpha1b1" |
// "alpha1b/alpha1b2" |
// "alpha2a/alpha2a1" |
// "alpha2a/alpha2a2" |
// "alpha2b/alpha2b1" |
// "alpha2b/alpha2b2"
