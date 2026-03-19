'use client';

import NextError from 'next/error';

type GlobalErrorProps = {
  error: Error & { digest?: string };
};

export default function GlobalError({ error }: GlobalErrorProps) {
  void error;

  return (
    <html lang="ko">
      <body>
        <NextError statusCode={500} />
      </body>
    </html>
  );
}
