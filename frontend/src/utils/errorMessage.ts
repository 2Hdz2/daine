import axios from 'axios';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getDetailMessage = (detail: unknown): string | undefined => {
  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        return isRecord(item) && typeof item.msg === 'string' ? item.msg : undefined;
      })
      .filter((message): message is string => Boolean(message));

    if (messages.length > 0) {
      return messages.join('; ');
    }
  }

  if (isRecord(detail) && typeof detail.msg === 'string') {
    return detail.msg;
  }

  return undefined;
};

export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error) || !isRecord(error.response?.data)) {
    return fallback;
  }

  return getDetailMessage(error.response.data.detail) ?? fallback;
};
