import type { Route } from "./+types/list";
import { caller } from '~/utils/trpc/server'
import { useNavigate } from "react-router";
import { auth } from '~/utils/auth/server'
import { Button } from "~/components/button/button";
import { ListContainer, ListItem } from "~/components/list/list";
import { getSubjectBySlug, TaalSlugEnum } from "~/components/Icons";
import { Plus, Trash } from "lucide-react";
import { useTRPC } from '~/utils/trpc/react'
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

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
  const trpc = useTRPC();

  const [isForumMutationHappening, setIsForumMutationHappening] = useState(false);

  const deletePostMutation = useMutation(
    trpc.forum.deleteItem.mutationOptions({
      onSuccess: () => {
        navigate('/app/forum'); // reload de pagina na het verwijderen van een post
      }
    })
  )

  return (
    <div className='flex flex-col items-center justify-center w-full p-0 m-0 mt-0'>
      <div className="w-full max-w flex flex-row items-center justify-between p-5">
        <h1 className="p-5 text-4xl font-bold">Forum</h1>

        <Button onClick={() => navigate('/app/forum/make')}>
          <Plus />
        </Button>
      </div>
      <ListContainer className="w-full max-w">
        {forumPosts?.map((post) => (
          <ListItem image={getSubjectBySlug(post.subject as TaalSlugEnum)?.icon} key={post.id} linkTo={`/app/forum/${post.id}`} title={post.title} subtitle={`By ${post.author.name} on ${new Date(post.createdAt).toLocaleDateString()}`}>
            {((user?.id || "this is not a valid uuid") === post.authorId || user?.role == "admin") && (
              <Button onClick={() => { deletePostMutation.mutate({ type: "POST", id: post.id }) }} disabled={isForumMutationHappening}><Trash /></Button>
            )}
          </ListItem>
        ))}
      </ListContainer>
    </div>
  )
}
