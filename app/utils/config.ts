const config = {
    refetchTime: 1000 * 30,
    refetch: true,
    lang: 'en',
    allowForumLinks: true,
    allowForumImages: true,
} as {
    refetchTime: number,
    refetch: boolean,
    lang: 'nl' | 'en',
    allowForumLinks: boolean,
    allowForumImages: boolean,
}

export default config;