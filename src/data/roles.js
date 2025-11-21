export const ROLES = {
    VILLAGER: 'VILLAGER',
    VAMPIRE: 'VAMPIRE',
    DOCTOR: 'DOCTOR',
    SHERIFF: 'SHERIFF',
    JESTER: 'JESTER'
};

export const ROLE_DESCRIPTIONS = {
    [ROLES.VILLAGER]: "An innocent villager. Your goal is to survive and vote out the vampires.",
    [ROLES.VAMPIRE]: "A creature of the night. Kill villagers at night and deceive them during the day.",
    [ROLES.DOCTOR]: "Can save one person each night from a vampire attack. Can save themselves.",
    [ROLES.SHERIFF]: "Can investigate one person each night to reveal their true identity.",
    [ROLES.JESTER]: "A chaotic neutral. Your ONLY goal is to get voted out by the village during the day."
};

export const ROLE_WEIGHTS = {
    [ROLES.VILLAGER]: 1,
    [ROLES.VAMPIRE]: -4,
    [ROLES.DOCTOR]: 3,
    [ROLES.SHERIFF]: 3,
    [ROLES.JESTER]: 0
};

export const ROLE_DETAILS = {
    [ROLES.VILLAGER]: {
        name: 'Villager',
        nameTR: 'Köylü',
        descriptionTR: 'Masum bir köylüsün. Amacın hayatta kalmak ve vampirleri oylayarak köyden göndermek.',
        alignment: 'good',
        nightAction: false,
        color: '#a5b4fc' // Indigo 300
    },
    [ROLES.VAMPIRE]: {
        name: 'Vampire',
        nameTR: 'Vampir',
        descriptionTR: 'Gecenin yaratığısın. Geceleri köylüleri avla, gündüzleri ise kendini gizle.',
        alignment: 'evil',
        nightAction: true,
        color: '#f87171' // Red 400
    },
    [ROLES.DOCTOR]: {
        name: 'Doctor',
        nameTR: 'Doktor',
        descriptionTR: 'Her gece bir kişiyi vampir saldırısından koruyabilirsin. Kendini de koruyabilirsin.',
        alignment: 'good',
        nightAction: true,
        color: '#4ade80' // Green 400
    },
    [ROLES.SHERIFF]: {
        name: 'Sheriff',
        nameTR: 'Şerif',
        descriptionTR: 'Her gece bir kişinin kimliğini araştırabilirsin. Şüpheli gördüklerini kontrol et.',
        alignment: 'good',
        nightAction: true,
        color: '#fbbf24' // Amber 400
    },
    [ROLES.JESTER]: {
        name: 'Jester',
        nameTR: 'Soytarı',
        descriptionTR: 'Kaosun elçisisin. TEK amacın gündüz oylamasında köy tarafından asılmak.',
        alignment: 'neutral',
        nightAction: false,
        color: '#c084fc' // Purple 400
    }
};

export const getDefaultConfig = (playerCount) => {
    let vampires = 1;
    if (playerCount >= 7) vampires = 2;
    if (playerCount >= 12) vampires = 3;

    return {
        vampireCount: vampires,
        hasDoctor: playerCount >= 4,
        hasSheriff: playerCount >= 6,
        hasJester: playerCount >= 5,
        doctorLimit: 1,
        sheriffLimit: 1,
        discussionDuration: 3
    };
};

export const calculateGameBalance = (playerCount, config) => {
    if (!playerCount || playerCount === 0) return 0;
    
    let score = 0;
    
    // Vampires
    score += (config.vampireCount * ROLE_WEIGHTS[ROLES.VAMPIRE]);
    
    // Special Roles
    if (config.hasDoctor) score += ROLE_WEIGHTS[ROLES.DOCTOR];
    if (config.hasSheriff) score += ROLE_WEIGHTS[ROLES.SHERIFF];
    if (config.hasJester) score += ROLE_WEIGHTS[ROLES.JESTER];
    
    // Remaining are Villagers
    const assignedCount = config.vampireCount + (config.hasDoctor ? 1 : 0) + (config.hasSheriff ? 1 : 0) + (config.hasJester ? 1 : 0);
    const villagerCount = Math.max(0, playerCount - assignedCount);
    
    score += (villagerCount * ROLE_WEIGHTS[ROLES.VILLAGER]);
    
    return score;
};

export const getRoleDistribution = (playerCount, config) => {
    const roles = [];
    
    // Add Vampires
    for (let i = 0; i < config.vampireCount; i++) roles.push(ROLES.VAMPIRE);

    // Add Special Roles
    if (config.hasDoctor) roles.push(ROLES.DOCTOR);
    if (config.hasSheriff) roles.push(ROLES.SHERIFF);
    if (config.hasJester) roles.push(ROLES.JESTER);

    // Fill rest with Villagers
    while (roles.length < playerCount) {
        roles.push(ROLES.VILLAGER);
    }

    // Shuffle roles
    return roles.sort(() => Math.random() - 0.5);
};
