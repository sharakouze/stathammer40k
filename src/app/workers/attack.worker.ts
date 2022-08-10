/// <reference lib="webworker" />

import { TargetBuilder } from "../scripts/target-builder";
import { WeaponBuilder } from "../scripts/weapon-builder";
import { IAttackWorkerData } from "../types/workers";

addEventListener('message', (ev: MessageEvent<IAttackWorkerData>) => {
  const { simcount, target, weapons } = ev.data;

  const tgt = new TargetBuilder()
    .setToughness(Number(target.toughness))
    .setArmorSave(Number(target.armorsave))
    .setInvulSave(Number(target.invulsave))
    .setFeelNoPain(Number(target.fnp))
    .setHitRollModifier(Number(target.hitrollmod))
    .setWoundRollModifier(Number(target.woundrollmod))
    .build();

  const map = new Map<string, number[]>();

  for (const weapon of weapons) {
    const builder = new WeaponBuilder()
      .setAttacks(weapon.attacks)
      .setToHit(Number(weapon.tohit))
      .setStrength(Number(weapon.strength))
      .setArmorPenetration(Number(weapon.ap))
      .setDamage(weapon.damage);

    console.log(weapon);

    const n1 = Number(weapon.onhit6additionalhits);
    if (n1) {
      builder.setOnHit(roll => {
        return { hitcount: roll === 6 ? n1 : 0 };
      });
    }

    const n2 = Number(weapon.onwound6mortalwounds);
    if (n2) {
      builder.setOnWound(roll => {
        return { mortalwoundcount: roll === 6 ? n2 : 0 };
      });
    }

    const wpn = builder.build();

    const damages: number[] = [];

    for (let i = 0; i < simcount; i++) {
      const dmg = wpn.attack(tgt);
      damages.push(dmg);
    }

    map.set(weapon.uuid, damages);
  }

  postMessage(map);
});
