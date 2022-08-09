import { MortalWoundFunction } from "./types";
import { Weapon } from "./weapon";

export class WeaponBuilder {

    private attacks?: number | string;
    private tohit?: number;
    private strength?: number;
    private ap?: number;
    private damage?: number | string;
    private wound?: MortalWoundFunction;
    private hitrollmod: number = 0;
    private woundrollmod: number = 0;

    constructor() {
    }

    setAttacks(value: string): this {
        const n = Number(value);
        this.attacks = Number.isNaN(n) ? value : n;
        return this;
    }

    setToHit(value: number): this {
        this.tohit = value;
        return this;
    }

    setStrength(value: number): this {
        this.strength = value;
        return this;
    }

    setArmorPenetration(value: number): this {
        this.ap = value;
        return this;
    }

    setDamage(value: string): this {
        const n = Number(value);
        this.damage = Number.isNaN(n) ? value : n;
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

    setMortalWound(value: MortalWoundFunction): this {
        this.wound = value;
        return this;
    }

    build(): Weapon {
        if (!this.attacks) {
            throw new Error('Attacks is null or undefined');
        }
        if (!this.tohit) {
            throw new Error('ToHit is null or undefined');
        }
        if (!this.strength) {
            throw new Error('Strength is null or undefined');
        }
        if (!this.ap) {
            throw new Error('ArmorPenetration is null or undefined');
        }
        if (!this.damage) {
            throw new Error('Damage is null or undefined');
        }

        return new Weapon(this.attacks, this.tohit, this.strength, this.ap, this.damage, this.hitrollmod, this.woundrollmod, this.wound);
    }
}
