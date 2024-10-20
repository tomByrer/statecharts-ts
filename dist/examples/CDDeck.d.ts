type CDDeckContext = {
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
declare const cdDeckMachine: import("../machineFactory").Machine<CDDeckContext>;
export default cdDeckMachine;
