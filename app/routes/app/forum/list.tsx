import type { Route } from "./+types/list";
import { caller } from '~/utils/trpc/server'
import { useNavigate } from "react-router";
import { auth } from '~/utils/auth/server'
import { Button } from "~/components/button/button";
import "./forum.css"
export async function loader(loaderArgs: Route.LoaderArgs) {
  const api = await caller(loaderArgs);
  const headers = new Headers(loaderArgs.request.headers)
  const result = await auth.api.getSession({ headers })
  const user = result?.user
  const forumPosts = await api.forum.getPosts({});
  return { forum: forumPosts, user: user };
}

export default function ForumHome({ loaderData: { forum: forumPosts, user: user } }: Route.ComponentProps) {
  const navigate = useNavigate();
  return (
    <div className='flex flex-col items-center justify-center min-h-screen min-w-screen'>
      <h1>Forum</h1> {/* deze h1 wil volgens mij echt geen h1 zijn en ziet er meer uit als een paragraph. */}
      <Button onClick={() => navigate('/app/forum/make')}>
        Create New Post
      </Button>
      <div>
        {forumPosts?.map((post) => (
          <a key={post.id} href={`/app/forum/${post.id}`}>
            <div className="post">
              <h2 className="text-xl font-bold text-center">{post.title}</h2>
              <p className="text-openlearn-400 font-extralight">{post.author.name} op {new Date(post.createdAt).toLocaleDateString()}</p>
              <p className="mt-2">{post.content}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
