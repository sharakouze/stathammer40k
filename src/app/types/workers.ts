import { ITarget, IWeapon } from "./app";

export interface IAttackWorkerData {
    simcount: number;
    target: ITarget;
    weapons: IWeapon[];
}