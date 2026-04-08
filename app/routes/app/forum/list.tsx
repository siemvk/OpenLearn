import type { Route } from "./+types/list";
import { caller } from '~/utils/trpc/server'
import { useNavigate } from "react-router";
import { auth } from '~/utils/auth/server'
import { Button } from "~/components/button/button";
import { ListContainer, ListItem } from "~/components/list/list";
import { getSubjectBySlug, TaalSlugEnum } from "~/components/Icons";

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
    <div className='flex flex-col items-center justify-center w-full p-0 m-0'>
      <h1 className="scale-150 text-xl font-bold">Forum</h1>
      <Button onClick={() => navigate('/app/forum/make')}>
        Create New Post
      </Button>
      <ListContainer className="w-full max-w">
        {forumPosts?.map((post) => (
          <ListItem image={getSubjectBySlug(post.subject as TaalSlugEnum)?.icon} key={post.id} linkTo={`/app/forum/${post.id}`} title={post.title} subtitle={`By ${post.author.name} on ${new Date(post.createdAt).toLocaleDateString()}`}>
          </ListItem>
        ))}
      </ListContainer>
    </div>
  )
}
