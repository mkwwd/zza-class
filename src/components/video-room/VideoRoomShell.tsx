import type { ReactNode } from 'react';

import { Clapperboard, Film, LibraryBig, LogOut } from 'lucide-react';
import Link from 'next/link';

import { logout } from '@/app/actions';

import styles from './video-room-shell.module.css';
import { StaffCat } from './VideoRoomVisuals';

type VideoRoomNavigationKey =
  'home' | 'catalog' | 'my-page' | 'history' | 'inventory' | 'upload';

type VideoRoomShellProps = {
  activeItem: VideoRoomNavigationKey;
  bagCount?: number;
  children: ReactNode;
  isAdmin?: boolean;
  mode?: 'shop' | 'staff';
  showStaffCat?: boolean;
};

const shopNavigation = [
  { href: '/main', icon: Film, key: 'home', label: '홈' },
  { href: '/my-page', icon: LibraryBig, key: 'my-page', label: '마이 페이지' },
] as const;

export function VideoRoomShell({
  activeItem,
  bagCount = 0,
  children,
  isAdmin = false,
  mode = 'shop',
  showStaffCat = true,
}: VideoRoomShellProps) {
  const isStaffMode = mode === 'staff';
  const showCatPanel = showStaffCat && !isStaffMode;
  const showEditingRoomLink = isAdmin || isStaffMode;

  return (
    <div className={`${styles.shell} ${styles.shopShell}`}>
      <aside className={`${styles.sidebar} ${styles.shopSidebar}`}>
        <Link className={styles.brand} href="/main">
          <span>VIDEO ROOM</span>
          <small>SHORT VIDEO RENTAL SHOP</small>
        </Link>

        {isStaffMode ? (
          <span className={styles.staffLabel}>STAFF ONLY</span>
        ) : null}

        <nav className={styles.navigation} aria-label="VIDEO ROOM 메뉴">
          {shopNavigation.map(({ href, icon: Icon, key, label }) => (
            <Link
              aria-current={activeItem === key ? 'page' : undefined}
              className={activeItem === key ? styles.active : undefined}
              href={href}
              key={key}>
              <Icon aria-hidden="true" size={21} strokeWidth={1.65} />
              <span>{label}</span>
            </Link>
          ))}
          {showEditingRoomLink ? (
            <Link
              aria-current={isStaffMode ? 'page' : undefined}
              className={isStaffMode ? styles.active : undefined}
              href="/admin">
              <Clapperboard aria-hidden="true" size={21} strokeWidth={1.65} />
              <span>편집실</span>
            </Link>
          ) : null}
        </nav>

        {showCatPanel ? (
          <div className={styles.catPanel}>
            <div className={styles.catBubble}>
              보고 싶은 이야기를 천천히 골라보세요.
            </div>
            <StaffCat className={styles.cat} />
            <strong>VIDEO CLUB</strong>
            <span>{`MY BAG · ${bagCount}`}</span>
          </div>
        ) : null}

        <form action={logout} className={styles.logoutForm}>
          <button type="submit">
            <LogOut aria-hidden="true" size={17} strokeWidth={1.7} />
            <span>로그아웃</span>
          </button>
        </form>
      </aside>

      <div className={styles.content}>{children}</div>
    </div>
  );
}
