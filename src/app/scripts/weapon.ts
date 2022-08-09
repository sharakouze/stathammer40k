import { DiceRoll } from "@dice-roller/rpg-dice-roller";
import { Target } from "./target";
import { MortalWoundFunction } from "./types";

export class Weapon {

    constructor(private attacks: number | string,
        private tohit: number,
        private strength: number,
        private ap: number,
        private damage: number | string,
        private hitrollmod: number,
        private woundrollmod: number,
        private wound: MortalWoundFunction | undefined
    ) {
    }

    private getHitRollModifier(target: Target): number {
        const mod = this.hitrollmod + target.hitrollmod;
        if (mod <= -1) {
            return -1;
        }
        if (mod >= 1) {
            return 1;
        }
        return 0;
    }

    private getWoundRollModifier(target: Target): number {
        const mod = this.woundrollmod + target.woundrollmod;
        if (mod <= -1) {
            return -1;
        }
        if (mod >= 1) {
            return 1;
        }
        return 0;
    }

    private getToWound(target: Target): number {
        if (this.strength >= target.toughness * 2) {
            return 2;
        }
        if (this.strength * 2 <= target.toughness) {
            return 6;
        }
        if (this.strength > target.toughness) {
            return 3;
        }
        if (this.strength < target.toughness) {
            return 5;
        }
        return 4;
    }

    private getSave(target: Target): number {
        if (target.armorsave) {
            const armorsave = target.armorsave - this.ap;

            if (target.invulsave) {
                return Math.min(armorsave, target.invulsave);
            }
            else {
                return armorsave;
            }
        }

        if (target.invulsave) {
            return target.invulsave;
        }

        return 0;
    }

    private dices = new Map<string, DiceRoll>();

    private getDiceRoll(notation: string): DiceRoll {
        const dr1 = this.dices.get(notation);
        if (dr1) {
            dr1.roll();
            return dr1;
        }
        const dr2 = new DiceRoll(notation);
        this.dices.set(notation, dr2);
        return dr2;
    }

    attack(target: Target): number {
        const d6 = (): number => {
            return Math.floor(Math.random() * 6) + 1;
        };

        let mortalcount = 0;

        const attackcount = typeof this.attacks === 'number' ? this.attacks : this.getDiceRoll(this.attacks).total;

        let hitcount = 0;
        const hitrollmod = this.getHitRollModifier(target);
        for (let i = 0; i < attackcount; i++) {
            if (this.tohit === 1) {
                hitcount++;
            }
            else {
                const roll = d6();
                if (roll === 1) continue;
                if (roll === 6 || roll + hitrollmod >= this.tohit) {
                    hitcount++;
                }
            }
        }

        let woundcount = 0;
        const towound = this.getToWound(target);
        const woundrollmod = this.getWoundRollModifier(target);
        for (let i = 0; i < hitcount; i++) {
            const roll = d6();
            if (roll === 1) continue;
            if (roll === 6 || roll + woundrollmod >= towound) {
                woundcount++;
            }

            if (this.wound) {
                const mw = this.wound(roll);
                mortalcount += mw;
            }
        }

        let savecount = 0;
        const save = this.getSave(target);
        if (save) {
            for (let i = 0; i < woundcount; i++) {
                const roll = d6();
                if (roll === 1) continue;
                if (roll >= save) {
                    savecount++;
                }
            }
        }

        let damagecount = 0;
        for (let i = 0; i < woundcount - savecount; i++) {
            const damage = typeof this.damage === 'number' ? this.damage : this.getDiceRoll(this.damage).total;
            damagecount += damage;
        }

        damagecount += mortalcount;

        if (target.fnp) {
            let fnpcount = 0;
            for (let i = 0; i < damagecount; i++) {
                const roll = d6();
                if (roll === 1) continue;
                if (roll >= target.fnp) {
                    fnpcount++;
                }
            }

            damagecount -= fnpcount;
        }

        return damagecount;
    }

}