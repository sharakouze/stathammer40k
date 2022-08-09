export interface IOptions {
    simcount: string;
    xaxis: string;
}

export interface ITarget {
    toughness: string;
    armorsave: string;
    invulsave: string;
    fnp: string;
    hitrollmod: string;
    woundrollmod: string;
}

export interface IWeapon {
    uuid: string;
    name: string;
    color: string;
    attacks: string;
    tohit: string;
    strength: string;
    ap: string;
    damage: string;
}

export interface IWeaponResult {
    uuid: string;
    mean: number;
    stddev: number;
}
