import { CassetteTape, Headphones, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createClient, hasSupabaseEnv } from '@/lib/supabase/server';

import { signIn, signUp } from './actions';
import { AuthSubmitButton } from './auth-submit-button';
import styles from './login-page.module.css';
import { PasswordField } from './password-field';

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    mode?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  'missing-fields': '이메일과 비밀번호를 입력해 주세요.',
  signin: '입장에 실패했어요. 이메일과 비밀번호를 확인해 주세요.',
  signup: '가입에 실패했어요. 다른 이메일이나 비밀번호를 사용해 주세요.',
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const isConfigured = hasSupabaseEnv();
  const { error, message, mode } = await searchParams;
  const isSignup = mode === 'signup';

  if (isConfigured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect('/main');
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.scene}>
          <Image
            alt="포근한 고양이가 어두운 비디오룸에서 빈티지 TV를 보는 모습"
            className={styles.sceneImage}
            fill
            priority
            sizes="(max-width: 920px) 100vw, 58vw"
            src="/images/video-room-login-scene.png"
          />
          <div className={styles.sceneShade} />

          <Link
            aria-label="비디오룸 작품 둘러보기"
            className={styles.neonBrand}
            href="/courses">
            <CassetteTape aria-hidden="true" size={25} strokeWidth={1.8} />
            <span>VIDEO ROOM</span>
          </Link>

          <div className={styles.sceneCaption}>
            <span>TONIGHT&apos;S SCREENING</span>
            <p>오늘 밤, 어떤 이야기를 빌려가실래요?</p>
          </div>
        </div>

        <div className={styles.formSide}>
          <div className={styles.panel}>
            <header className={styles.brandHeader}>
              <div className={styles.logoMark}>
                <CassetteTape aria-hidden="true" size={32} strokeWidth={1.7} />
              </div>
              <div>
                <strong>VIDEO ROOM</strong>
                <span>SHORT VIDEO RENTAL SHOP</span>
              </div>
            </header>

            <div className={styles.intro}>
              <h1>{isSignup ? '새 보관함 만들기' : '다시 만났네요'}</h1>
              <p>
                {isSignup
                  ? '계정을 만들고 마음에 든 숏드라마를 보관해 보세요.'
                  : '로그인하고 보던 장면부터 다시 이어보세요.'}
              </p>
            </div>

            {error ? (
              <p className={styles.error} role="alert">
                {errorMessages[error] ??
                  '문제가 발생했어요. 다시 시도해 주세요.'}
              </p>
            ) : null}

            {message === 'check-email' ? (
              <p className={styles.notice} role="status">
                이메일 인증을 완료한 뒤 로그인해 주세요.
              </p>
            ) : null}

            {!isConfigured ? (
              <p className={styles.notice} role="status">
                Supabase 환경 변수를 먼저 설정해 주세요.
              </p>
            ) : null}

            <form action={isSignup ? signUp : signIn} className={styles.form}>
              <label className={styles.field}>
                <span>이메일</span>
                <span className={styles.inputShell}>
                  <Mail aria-hidden="true" size={19} strokeWidth={1.7} />
                  <input
                    autoComplete="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    type="email"
                  />
                </span>
              </label>

              <PasswordField isSignup={isSignup} />

              <AuthSubmitButton
                isConfigured={isConfigured}
                isSignup={isSignup}
              />
            </form>

            <div className={styles.switchRow}>
              <span>
                {isSignup ? '이미 보관함이 있나요?' : '비디오룸이 처음인가요?'}
              </span>
              <Link href={isSignup ? '/' : '/?mode=signup'}>
                {isSignup ? '로그인' : '계정 만들기'}
              </Link>
            </div>
          </div>

          <footer className={styles.footer}>
            <span className={styles.help}>
              <Headphones aria-hidden="true" size={18} />
              도움이 필요하신가요?
            </span>
            <span>© VIDEO ROOM</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
