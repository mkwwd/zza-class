'use client';

import { useEffect, useRef, useState } from 'react';

import { Search, X } from 'lucide-react';
import Image from 'next/image';

import { getCatAssistantCopy } from './cat-search-assistant-state';
import styles from './video-room.module.css';

type CatSearchCounterProps = {
  initialQuery: string;
};

export function CatSearchCounter({ initialQuery }: CatSearchCounterProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(initialQuery));
  const catButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  function closeSearch() {
    setIsSearchOpen(false);
    requestAnimationFrame(() => catButtonRef.current?.focus());
  }

  return (
    <div className={styles.counterScene}>
      <Image
        alt="따뜻한 조명이 켜진 비디오 대여점 카운터의 파란 눈 고양이 직원"
        className={styles.counterImage}
        fill
        priority
        sizes="(max-width: 900px) 100vw, 65vw"
        src="/images/video-room-counter-cat.png"
      />
      <div className={styles.sceneShade} />

      <div aria-label="비디오룸 영업 중" className={styles.openSign} role="img">
        <strong>OPEN</strong>
        <span>VIDEO RENTAL</span>
      </div>

      <div
        aria-live="polite"
        className={`${styles.catSpeechBubble} ${isSearchOpen ? styles.searchBubbleOpen : ''}`}
        id="cat-search-bubble">
        {isSearchOpen ? (
          <button
            aria-label="검색 말풍선 닫기"
            className={styles.closeBubbleButton}
            onClick={closeSearch}
            title="닫기"
            type="button">
            <X aria-hidden="true" size={17} />
          </button>
        ) : null}
        <p>{getCatAssistantCopy(isSearchOpen)}</p>
        {isSearchOpen ? (
          <form action="/main" className={styles.bubbleSearchForm}>
            <label className={styles.srOnly} htmlFor="cat-video-search">
              작품 검색
            </label>
            <Search aria-hidden="true" size={17} strokeWidth={1.8} />
            <input
              autoComplete="off"
              defaultValue={initialQuery}
              id="cat-video-search"
              name="q"
              placeholder="작품 제목을 입력해 주세요"
              ref={searchInputRef}
              type="search"
            />
            <button aria-label="검색" title="검색" type="submit">
              <Search aria-hidden="true" size={18} strokeWidth={2} />
            </button>
          </form>
        ) : null}
      </div>

      <button
        aria-controls="cat-search-bubble"
        aria-expanded={isSearchOpen}
        aria-label="고양이 직원에게 비디오 찾기 요청하기"
        className={styles.catHotspot}
        onClick={() => setIsSearchOpen(true)}
        ref={catButtonRef}
        type="button">
        <span aria-hidden="true" className={styles.catSearchCue}>
          <Search size={19} strokeWidth={2} />
        </span>
        <span className={styles.srOnly}>고양이에게 비디오 검색 부탁하기</span>
      </button>
    </div>
  );
}
