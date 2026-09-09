'use client';

import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';

import Link from 'next/link';

import type { TapeDisplay } from '@/lib/courses/course-display';

export type ShelfTape = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  hasPlayableVideo: boolean;
  display: TapeDisplay;
};

type VideoShelfTheaterProps = {
  tapes: ShelfTape[];
  userHref: string;
  userLabel: string;
};

const toneClasses: Record<TapeDisplay['tone'], string> = {
  amber: 'from-[#f3a43b] via-[#9b4d17] to-[#2d160f]',
  cyan: 'from-[#69d7e8] via-[#167c8d] to-[#082c37]',
  rose: 'from-[#f43f5e] via-[#9f1239] to-[#2b0714]',
  violet: 'from-[#a78bfa] via-[#6d28d9] to-[#211044]',
};

export function VideoShelfTheater({
  tapes,
  userHref,
  userLabel,
}: VideoShelfTheaterProps) {
  const [selectedId, setSelectedId] = useState(tapes[0]?.id ?? '');
  const selectedIndex = Math.max(
    0,
    tapes.findIndex((tape) => tape.id === selectedId),
  );
  const selectedTape = tapes[selectedIndex];

  const spotlight = useMemo(() => {
    if (!tapes.length) {
      return 18;
    }

    return 10 + selectedIndex * (76 / Math.max(1, tapes.length - 1));
  }, [selectedIndex, tapes.length]);

  if (!tapes.length) {
    return (
      <section className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-6xl items-center px-5 py-12">
        <div className="w-full border border-dashed border-[#60473c] bg-[#120d0b] p-8 text-[#f8efe7]">
          <p className="text-sm font-black text-[#ff4d6d]">ZZA VIDEO</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-[-0.03em] md:text-6xl">
            아직 진열된 테이프가 없어요
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#c9b8aa]">
            공개된 작품이 등록되면 이곳이 비디오 책장으로 바뀝니다.
          </p>
          <Link
            className="mt-8 inline-flex h-12 items-center bg-[#ff4d6d] px-5 text-sm font-black text-[#18070d] transition hover:bg-[#ff7a92] focus:ring-2 focus:ring-[#ff8ea3] focus:outline-none"
            href={userHref}>
            {userLabel}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative isolate overflow-hidden bg-[#080607] text-[#fff7ed]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_25%_18%,rgba(255,77,109,0.24),transparent_36%),radial-gradient(circle_at_80%_10%,rgba(105,215,232,0.14),transparent_30%)]" />

      <div className="relative mx-auto grid min-h-[100dvh] w-full max-w-7xl gap-8 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
        <div className="flex min-h-[640px] flex-col justify-between gap-6">
          <header className="flex h-14 items-center justify-between">
            <Link
              className="text-xl font-black tracking-[-0.03em]"
              href="/courses">
              ZZA VIDEO
            </Link>
            <nav className="hidden items-center gap-6 text-sm font-bold text-[#d7c7bb] md:flex">
              <a className="transition hover:text-white" href="#shelf">
                테이프 책장
              </a>
              <a className="transition hover:text-white" href="#tv">
                TV
              </a>
              <Link className="transition hover:text-white" href={userHref}>
                {userLabel}
              </Link>
            </nav>
          </header>

          <div className="grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:items-end">
            <div className="order-2 lg:order-1">
              <div
                aria-hidden="true"
                className="video-shop-character"
                style={{ '--spotlight': `${spotlight}%` } as CSSProperties}>
                <div className="character-head" />
                <div className="character-body" />
                <div className="character-arm" />
                <div className="character-leg left" />
                <div className="character-leg right" />
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="max-w-3xl">
                <h1 className="text-5xl font-black tracking-[-0.04em] text-balance md:text-7xl">
                  오늘 밤 볼 테이프를 고르세요
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-[#d7c7bb]">
                  짧은 드라마를 비디오 책장에서 꺼내 TV에 넣는 감각으로
                  둘러보세요. 작품을 고르면 회차 선택은 TV 안에서 이어집니다.
                </p>
              </div>

              <div
                className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
                id="shelf">
                {tapes.map((tape) => {
                  const isSelected = tape.id === selectedTape.id;

                  return (
                    <button
                      aria-pressed={isSelected}
                      className={[
                        'group cursor-pointer border border-[#49342d] bg-[#140f0d] p-3 text-left transition duration-200 focus:ring-2 focus:ring-[#ff4d6d] focus:outline-none',
                        isSelected
                          ? 'translate-y-[-2px] border-[#ff4d6d] shadow-[0_18px_50px_rgba(255,77,109,0.16)]'
                          : 'hover:translate-y-[-2px] hover:border-[#b08372]',
                      ].join(' ')}
                      key={tape.id}
                      onClick={() => setSelectedId(tape.id)}
                      type="button">
                      <span
                        className={[
                          'block h-28 bg-gradient-to-br p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]',
                          toneClasses[tape.display.tone],
                        ].join(' ')}>
                        <span className="block border border-white/35 bg-white/90 px-2 py-1 text-[11px] font-black tracking-[0.18em] text-[#22110f]">
                          {tape.display.code}
                        </span>
                        <span className="mt-5 line-clamp-2 block text-lg leading-5 font-black text-white">
                          {tape.title}
                        </span>
                      </span>
                      <span className="mt-3 flex items-center justify-between gap-3 text-xs font-bold text-[#c9b8aa]">
                        <span>{tape.display.episodeLabel}</span>
                        <span>{tape.display.shelfLabel}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <aside className="relative" id="tv">
          <div className="rounded-[22px] border border-[#3d332e] bg-[#1a1513] p-4 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <div className="rounded-[18px] border border-[#5b4a40] bg-[#2a221e] p-4">
              <div className="relative overflow-hidden rounded-[16px] border border-[#0d0b0a] bg-black">
                <div className="tv-static absolute inset-0 z-10 opacity-30" />
                {selectedTape.thumbnailUrl ? (
                  <div
                    aria-label={`${selectedTape.title} 미리보기`}
                    className="aspect-[4/3] bg-cover bg-center"
                    role="img"
                    style={{
                      backgroundImage: `linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.72)),url(${selectedTape.thumbnailUrl})`,
                    }}
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-end bg-[radial-gradient(circle_at_30%_22%,rgba(255,77,109,0.36),transparent_30%),linear-gradient(135deg,#211044,#070607_62%)] p-5">
                    <div>
                      <p className="text-xs font-black tracking-[0.22em] text-[#ff9caf]">
                        NOW PLAYING
                      </p>
                      <h2 className="mt-2 text-3xl leading-none font-black tracking-[-0.03em]">
                        {selectedTape.title}
                      </h2>
                    </div>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 z-20 p-5">
                  <p className="text-xs font-black tracking-[0.22em] text-[#ff9caf]">
                    {selectedTape.display.code}
                  </p>
                  <h2 className="mt-2 line-clamp-2 text-3xl leading-none font-black tracking-[-0.03em]">
                    {selectedTape.title}
                  </h2>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-[#4b3d35] pt-4">
                <div className="flex items-center justify-between text-sm font-bold text-[#c9b8aa]">
                  <span>{selectedTape.display.episodeLabel}</span>
                  <span>{selectedTape.display.runtimeLabel}</span>
                </div>
                <p className="line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[#d7c7bb]">
                  {selectedTape.description ||
                    '아직 시놉시스가 비어 있어요. 제목을 열면 등록된 회차를 확인할 수 있습니다.'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTape.hasPlayableVideo ? (
                    <Link
                      className="flex h-12 items-center justify-center bg-[#ff4d6d] px-4 text-sm font-black text-[#18070d] transition hover:bg-[#ff7a92] focus:ring-2 focus:ring-[#ff8ea3] focus:outline-none"
                      href={`/courses/${selectedTape.id}`}>
                      TV에서 회차 선택
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="flex h-12 items-center justify-center bg-[#201a18] px-4 text-sm font-black text-[#8e877f]">
                      회차 준비중
                    </span>
                  )}
                  <Link
                    className="flex h-12 items-center justify-center border border-[#60473c] px-4 text-sm font-black text-[#f8efe7] transition hover:border-[#ff8ea3] focus:ring-2 focus:ring-[#ff8ea3] focus:outline-none"
                    href={userHref}>
                    {userLabel}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
