import nl from '~/../public/icons/nl.svg';
import en from '~/../public/icons/en.svg';
import fr from '~/../public/icons/fr.svg';
import de from '~/../public/icons/ge.svg';
import la from '~/../public/icons/la.svg';
import gr from '~/../public/icons/gr.svg';
import sp from '~/../public/icons/sp.svg';

export type subject = {
    name: string, // dit mapped aan i18n
    slug: TaalSlugEnum,
    icon: any, // TODO: fix this type
    taalData?: {
        van: TaalSlugEnum,
        naar: TaalSlugEnum
    }
}

export enum TaalSlugEnum {
    NL = 'nl', // nederlands
    EN = 'en', // engels
    FR = 'fr', // frans
    DE = 'de', // duits
    LA = 'la', // latijn
    GR = 'gr', // grieks
    SP = 'sp', // spaans
}

export const subjects: subject[] = [
    {
        name: 'icons:nederlands',
        slug: TaalSlugEnum.NL,
        icon: nl,
        taalData: {
            van: TaalSlugEnum.NL,
            naar: TaalSlugEnum.NL
        }
    },
    {
        name: 'icons:engels',
        slug: TaalSlugEnum.EN,
        icon: en,
        taalData: {
            van: TaalSlugEnum.NL,
            naar: TaalSlugEnum.EN
        }
    },
    {
        name: 'icons:frans',
        slug: TaalSlugEnum.FR,
        icon: fr,
        taalData: {
            van: TaalSlugEnum.NL,
            naar: TaalSlugEnum.FR
        }
    },
    {
        name: 'icons:duits',
        slug: TaalSlugEnum.DE,
        icon: de,
        taalData: {
            van: TaalSlugEnum.NL,
            naar: TaalSlugEnum.DE
        }
    },
    {
        name: 'icons:latijn',
        slug: TaalSlugEnum.LA,
        icon: la,
        taalData: {
            van: TaalSlugEnum.LA,
            naar: TaalSlugEnum.NL
        }
    },
    {
        name: 'icons:grieks',
        slug: TaalSlugEnum.GR,
        icon: gr,
        taalData: {
            van: TaalSlugEnum.GR,
            naar: TaalSlugEnum.NL
        }
    },
]

export const getSubjectBySlug = (slug: TaalSlugEnum | string) => {
    return subjects.find(s => s.slug === slug.toLowerCase());
}
