import type { Route } from "./+types/makePost";
import { redirect } from 'react-router';
import { useNavigate } from 'react-router';
import { auth } from '~/utils/auth/server.server';
import { Button } from "~/components/button/button";
import "~/components/text-field/text-field.css";
import { subjects, TaalSlugEnum } from "~/components/Icons";
import { useTranslation } from "react-i18next";
import { useTRPC } from "~/utils/trpc/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { getErrorMessage } from "~/utils/error-message";

export async function loader(loaderArgs: Route.LoaderArgs) {
  const headers = new Headers(loaderArgs.request.headers);
  const result = await auth.api.getSession({ headers });
  const user = result?.user;
  if (!user) {
    return redirect('/auth/login');
  }
  return user;
}

export default function MakePost() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState<TaalSlugEnum>(subjects[0]?.slug ?? TaalSlugEnum.NL);
  const [error, setError] = useState<string | null>(null);

  const makePostMutation = useMutation(
    trpc.forum.makePost.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.forum.getPosts.queryKey() });
        navigate('/app/forum');
      },
      onError: (err) => {
        setError(getErrorMessage(err, "errors.api.createPost"));
      },
    })
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError(t('Please fill in all fields'));
      return;
    }

    makePostMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      subject,
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">{t('Create a new post')}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">{t('Title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('Enter post title')}
              className="text-field1 w-full"
              disabled={makePostMutation.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('Subject')}</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as TaalSlugEnum)}
              className="text-field1 w-full"
              disabled={makePostMutation.isPending}
            >
              {subjects.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {t(s.name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('Content')}</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('Write your post content...')}
              rows={8}
              className="text-field1-large w-full"
              disabled={makePostMutation.isPending}
            />
          </div>

          <Button type="submit" disabled={makePostMutation.isPending}>
            {makePostMutation.isPending ? t('Creating...') : t('Create Post')}
          </Button>
        </form>
      </div>
    </div>
  );
}
