import { prefix, route, type RouteConfig } from "@react-router/dev/routes";

export default [
    route("/", "routes/_index.tsx"),

    route('/api/auth/*', 'routes/api/auth.ts'),
    route('/api/trpc/*', 'routes/api/trpc.ts'),
    route('/app', 'routes/app/home.tsx'),
    ...prefix('/app/forum', [
        route('', 'routes/app/forum/list.tsx'),
        route('make', 'routes/app/forum/makePost.tsx'),
        route(':postId', 'routes/app/forum/viewpost.tsx'),
    ]),
    ...prefix('/auth', [
        route('/login', 'routes/auth/login.tsx'),
        route('/signup', 'routes/auth/signup.tsx'),
    ]),
] satisfies RouteConfig;