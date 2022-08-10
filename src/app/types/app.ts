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
    hitrollmod: string;
    woundrollmod: string;
    onhit6additionalhits: string;
    onwound6mortalwounds: string;
}

export interface IWeaponResult {
    uuid: string;
    mean: number;
    stddev: number;
    median: number;
}
