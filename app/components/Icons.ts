import nederlands from '~/../public/icons/nederlands.svg';

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
    WI = 'wi', // wiskunde
    NA = 'na', // natuurkunde
    SC = 'sc', // scheikunde
    NS = 'ns' // nask
}

export const subjects: subject[] = [
    {
        name: 'icons:nederlands',
        slug: TaalSlugEnum.NL,
        icon: nederlands,
        taalData: {
            van: TaalSlugEnum.NL,
            naar: TaalSlugEnum.NL
        }
    },
    {
        name: 'icons:engels',
        slug: TaalSlugEnum.EN,
        icon: nederlands,
        taalData: {
            van: TaalSlugEnum.NL,
            naar: TaalSlugEnum.EN
        }
    },
]

export const getSubjectBySlug = (slug: TaalSlugEnum | string) => {
    return subjects.find(s => s.slug === slug.toLowerCase());
}
