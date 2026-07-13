export type TeacherLoginResponse = {
  token: string;
  supabaseToken: string;
  teacher: {
    id: string;
    username: string;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function readResponseBody(response: Response): Promise<unknown> {
  const rawBody = await response.clone().text();
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';

  if (contentType.includes('application/json')) {
    try {
      return rawBody ? JSON.parse(rawBody) : null;
    } catch {
      return rawBody.trim() ? rawBody : null;
    }
  }

  return rawBody.trim() ? rawBody : null;
}

export function extractErrorMessage(body: unknown, fallbackMessage: string): string {
  if (typeof body === 'string') {
    return body;
  }

  if (isRecord(body)) {
    const error = body.error;
    if (typeof error === 'string' && error.trim()) {
      return error;
    }

    const message = body.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallbackMessage;
}

export function isTeacherLoginResponse(body: unknown): body is TeacherLoginResponse {
  if (!isRecord(body)) {
    return false;
  }

  const { token, supabaseToken, teacher } = body;
  if (typeof token !== 'string' || typeof supabaseToken !== 'string') {
    return false;
  }

  if (!isRecord(teacher)) {
    return false;
  }

  return typeof teacher.id === 'string' && typeof teacher.username === 'string';
}