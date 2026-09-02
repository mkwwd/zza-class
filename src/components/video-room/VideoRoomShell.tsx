import type { ReactNode } from 'react';

import {
  Clapperboard,
  Film,
  FolderOpen,
  Heart,
  History,
  Home,
  LibraryBig,
  LogOut,
  Settings,
  UploadCloud,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';

import { logout } from '@/app/actions';

import styles from './video-room-shell.module.css';
import { StaffCat } from './VideoRoomVisuals';

export type VideoRoomNavigationKey =
  | 'home'
  | 'catalog'
  | 'my-page'
  | 'favorites'
  | 'history'
  | 'inventory'
  | 'upload'
  | 'settings';

type VideoRoomShellProps = {
  activeItem: VideoRoomNavigationKey;
  bagCount?: number;
  children: ReactNode;
  isAdmin?: boolean;
  mode?: 'shop' | 'staff';
  showStaffCat?: boolean;
};

const shopNavigation = [
  { href: '/main', icon: Home, key: 'home', label: '홈' },
  { href: '/courses', icon: Film, key: 'catalog', label: '새로운 작품' },
  { href: '/my-page', icon: UserRound, key: 'my-page', label: '마이 페이지' },
  { href: '/courses', icon: Heart, key: 'favorites', label: '찜한 작품' },
  { href: '/my-page', icon: History, key: 'history', label: '시청 기록' },
] as const;

const staffNavigation = [
  { href: '/admin', icon: LibraryBig, key: 'inventory', label: '비디오 관리' },
  {
    href: '/admin/courses/new',
    icon: UploadCloud,
    key: 'upload',
    label: '새 비디오 등록',
  },
  { href: '/main', icon: FolderOpen, key: 'home', label: '스토어 보기' },
  { href: '/admin', icon: Settings, key: 'settings', label: '설정' },
] as const;

export function VideoRoomShell({
  activeItem,
  bagCount = 0,
  children,
  isAdmin = false,
  mode = 'shop',
  showStaffCat = true,
}: VideoRoomShellProps) {
  const navigation = mode === 'staff' ? staffNavigation : shopNavigation;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/main">
          <span>VIDEO ROOM</span>
          <small>SHORT VIDEO RENTAL SHOP</small>
        </Link>

        {mode === 'staff' ? (
          <span className={styles.staffLabel}>STAFF ONLY</span>
        ) : null}

        <nav className={styles.navigation} aria-label="VIDEO ROOM 메뉴">
          {navigation.map(({ href, icon: Icon, key, label }) => (
            <Link
              aria-current={activeItem === key ? 'page' : undefined}
              className={activeItem === key ? styles.active : undefined}
              href={href}
              key={`${key}-${label}`}>
              <Icon aria-hidden="true" size={21} strokeWidth={1.65} />
              <span>{label}</span>
            </Link>
          ))}
          {mode === 'shop' && isAdmin ? (
            <Link href="/admin">
              <Clapperboard aria-hidden="true" size={21} strokeWidth={1.65} />
              <span>편집실</span>
            </Link>
          ) : null}
        </nav>

        {showStaffCat ? (
          <div className={styles.catPanel}>
            <div className={styles.catBubble}>
              {mode === 'staff'
                ? '오늘도 멋진 작품을 정리해 볼까요?'
                : '보고 싶은 이야기를 천천히 골라보세요.'}
            </div>
            <StaffCat className={styles.cat} priority={false} />
            <strong>{mode === 'staff' ? 'STAFF CAT' : 'VIDEO CLUB'}</strong>
            <span>
              {mode === 'staff'
                ? '업무 도우미 · ONLINE'
                : `MY BAG · ${bagCount}`}
            </span>
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
