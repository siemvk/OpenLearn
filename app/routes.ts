import { type RouteConfig, index, route } from "@react-router/dev/routes"
import { flatRoutes } from "@react-router/fs-routes";;

export default [index("routes/home.tsx"), ...(await flatRoutes({ ignoredRouteFiles: ["routes/home.tsx"], })),] satisfies RouteConfig;
