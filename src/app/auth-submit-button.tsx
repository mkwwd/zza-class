'use client';

import { LoaderCircle, LogIn, UserRoundPlus } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import styles from './login-page.module.css';

type AuthSubmitButtonProps = {
  isConfigured: boolean;
  isSignup: boolean;
};

export function AuthSubmitButton({
  isConfigured,
  isSignup,
}: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();
  const label = pending
    ? isSignup
      ? '가입하는 중...'
      : '로그인 중...'
    : isSignup
      ? '가입하기'
      : '로그인';

  return (
    <button
      aria-busy={pending}
      className={styles.submitButton}
      disabled={!isConfigured || pending}
      type="submit">
      {pending ? (
        <LoaderCircle
          aria-hidden="true"
          className={styles.loadingIcon}
          size={19}
        />
      ) : isSignup ? (
        <UserRoundPlus aria-hidden="true" size={19} />
      ) : (
        <LogIn aria-hidden="true" size={19} />
      )}
      {label}
    </button>
  );
}
