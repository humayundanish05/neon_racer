export const state = {
    speed: 0,
    distance: 0,
    laneX: 0, // Player X (-7.5 to 7.5 range)
    health: 3,
    invulnTimer: 0,
    warnTimer: 0,
    warnCooldown: 0,

    // NITRO STATE
    boostInput: false,
    boosting: false,
    boostFuel: 12.0, // Seconds
    boostMax: 12.0,
    boostCooldown: false, // Recharging state
    boostRechargeTime: 4.0,
    boostRechargeTimer: 0,

    playing: false
};

export const userSettings = {
    type: 'muscle',
    color: '#ff0000',
    muted: false,
    biome: 'city',
    controlType: 'buttons' // slider, buttons, wheel
};

export const input = { left: false, right: false, gas: false, brake: false, steer: 0 };
