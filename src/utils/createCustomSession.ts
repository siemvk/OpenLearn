interface WordData {
  "1": string;
  "2": string;
  id: number;
}

interface CreateCustomSessionParams {
  words: WordData[];
  subject: string;
  lang_from: string;
  lang_to: string;
  mode?: string;
  method?: string;
  flipQuestionLang?: boolean;
}

export async function createCustomSession(params: CreateCustomSessionParams) {
  const {
    words,
    subject,
    lang_from,
    lang_to,
    mode = 'test',
    method = 'test',
    flipQuestionLang = false
  } = params;

  const response = await fetch('/api/v1/lists/session/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      words,
      subject,
      lang_from,
      lang_to,
      mode,
      method,
      flipQuestionLang
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create custom session');
  }

  return await response.json();
}
