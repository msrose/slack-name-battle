exports.messages = [
    {
        test: value => value >= 80,
        format: (targetName, lifeForce) =>
            `${targetName} is barely affected, with *${lifeForce}%* life force remaining!`,
        adjectives: [
            'A paltry',
            'A pitiful',
            'A weak',
            'A pathetic',
            'A useless',
            'An insignificant',
            'An inconsequential',
        ],
        emojis: [
            ':joy:',
            ':feelsgoodman:',
            ':pogchamp:',
            ':partyparrot:',
            ':laughing:',
            ':ghost:',
        ],
    },
    {
        test: value => value >= 50,
        format: (targetName, lifeForce) =>
            `${targetName} is wounded, with *${lifeForce}%* life force remaining!`,
        adjectives: [
            'A worrying',
            'A concerning',
            'An inflammatory',
            'A potent',
            'A bothersome',
            'A disquieting',
            'An agitating',
        ],
        emojis: [
            ':gun:',
            ':rage:',
            ':angry:',
            ':sad_parrot:',
            ':cry:',
            ':sob:',
            ':crying_cat_face:',
            ':feelsbadman:',
            ':biblethump:',
        ],
    },
    {
        test: value => value > 0,
        format: (targetName, lifeForce) =>
            `${targetName} is critically injured, with *${lifeForce}%* life force remaining!`,
        adjectives: [
            'A destructive',
            'A vicious',
            'A merciless',
            'A cruel',
            'A ferocious',
            'A ruthless',
            'A fiendish',
        ],
        emojis: [
            ':face_with_head_bandage:',
            ':hospital:',
            ':knife:',
            ':dagger_knife:',
            ':crossed_swords:',
            ':hammer:',
            ':syringe:',
        ],
    },
    {
        test: value => value <= 0,
        format: targetName =>
            `${targetName} is dead, with *0%* life force remaining!`,
        adjectives: [
            'A devastating',
            'A catastrophic',
            'An apocalyptic',
            'A calamitous',
            'A cataclysmic',
            'A ruinous',
            'A dire',
        ],
        emojis: [
            ':skull:',
            ':skull_and_crossbones:',
            ':coffin:',
            ':funeral_urn:',
        ],
    },
]
