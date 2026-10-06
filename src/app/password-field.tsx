'use client';

import { useState } from 'react';

import { Eye, EyeOff, LockKeyhole } from 'lucide-react';

import styles from './login-page.module.css';

type PasswordFieldProps = {
  isSignup: boolean;
};

export function PasswordField({ isSignup }: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className={styles.field}>
      <span>비밀번호</span>
      <span className={styles.inputShell}>
        <LockKeyhole aria-hidden="true" size={19} strokeWidth={1.7} />
        <input
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          minLength={isSignup ? 6 : undefined}
          name="password"
          placeholder={
            isSignup ? '6자 이상 입력해 주세요' : '비밀번호를 입력해 주세요'
          }
          required
          type={isVisible ? 'text' : 'password'}
        />
        <button
          aria-label={isVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
          className={styles.passwordToggle}
          onClick={() => setIsVisible((visible) => !visible)}
          type="button">
          {isVisible ? (
            <EyeOff aria-hidden="true" size={19} />
          ) : (
            <Eye aria-hidden="true" size={19} />
          )}
        </button>
      </span>
    </label>
  );
}
