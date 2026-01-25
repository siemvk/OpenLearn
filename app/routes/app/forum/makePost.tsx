import type { Route } from "./+types/list";
import { caller } from '~/utils/trpc/server'
import { redirect, Form } from 'react-router'
import { Button } from '@polarnl/polarui-react'
import { auth } from '~/utils/auth/server'

export async function action(actionArgs: Route.ActionArgs) {
  const formData = await actionArgs.request.formData();
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  const api = await caller(actionArgs);
  try {
    // hard code de taal voor nu
    await api.forum.makePost({ title, content, subject: 'NL' });
  } catch (e) {
    // we redirecten de gebruiker naar de login pagina omdat 99% van de gevalen is de error een niet geauthed error
    // en ik heb geen zin om het te checken voor een tijdenlijken check
    return redirect('/auth/login');
  }
  return redirect('/app/forum');
}

export async function loader(loaderArgs: Route.LoaderArgs) {
  const headers = new Headers(loaderArgs.request.headers)
  // wrs kunnen we hier een wrapper om heen maken
  const result = await auth.api.getSession({ headers })
  const user = result?.user
  if (!user) {
    return redirect('/auth/login')
  }
  return user
}

export default function ForumHome() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen min-w-screen'>
      <h1 className='text-2xl font-bold mb-6'>Create a New Post</h1>
      <Form method='post' className='flex flex-col gap-4 w-full max-w-md'>
        <input
          type='text'
          name='title'
          placeholder='Post title'
          className='border rounded px-4 py-2'
        />
        <textarea
          name='content'
          placeholder='Write your post content...'
          rows={6}
          className='border rounded px-4 py-2'
        />
        <Button type='submit'>Submit Post</Button>
      </Form>
    </div>
  )
}
