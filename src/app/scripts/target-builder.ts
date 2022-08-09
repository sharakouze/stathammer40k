import { Target } from "./target";

export class TargetBuilder {

    private toughness?: number;
    private armorsave?: number;
    private invulsave?: number;
    private fnp?: number;

    private hitrollmod: number = 0;
    private woundrollmod: number = 0;

    constructor() {
    }

    setToughness(value: number): this {
        this.toughness = value;
        return this;
    }

    setArmorSave(value: number): this {
        this.armorsave = value;
        return this;
    }

    setInvulSave(value: number): this {
        this.invulsave = value;
        return this;
    }

    setFeelNoPain(value: number): this {
        this.fnp = value;
        return this;
    }

    setHitRollModifier(value: number): this {
        this.hitrollmod = value;
        return this;
    }

    setWoundRollModifier(value: number): this {
        this.woundrollmod = value;
        return this;
    }

    build(): Target {
        if (!this.toughness) {
            throw new Error('Toughness is null or undefined');
        }

        return new Target(this.toughness, this.armorsave || 0, this.invulsave || 0, this.fnp || 0, this.hitrollmod, this.woundrollmod);
    }
}
