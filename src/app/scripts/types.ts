
export type AttacksFunction = () => number;

export type MortalWoundFunction = (roll: number) => number;

export type DamageFunction = () => number;

export interface ChartPoint {
    x: number,
    y: number
}