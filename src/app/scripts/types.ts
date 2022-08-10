export type OnHitFunction = (roll: number) => {
    hitcount: number
};

export type OnWoundFunction = (roll: number) => {
    mortalwoundcount: number
};
