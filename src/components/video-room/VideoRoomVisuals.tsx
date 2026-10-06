import Image from 'next/image';

import styles from './video-room-shell.module.css';

type StaffCatProps = {
  className?: string;
  priority?: boolean;
};

type VideoCaseProps = {
  className?: string;
  runtime?: string;
  thumbnailUrl?: string | null;
  title: string;
};

type VhsTapeProps = {
  className?: string;
  code?: string;
  label?: string;
  orientation?: 'horizontal' | 'vertical';
};

export function StaffCat({ className, priority = false }: StaffCatProps) {
  return (
    <span className={`${styles.staffCat} ${className ?? ''}`}>
      <Image
        alt="파란 눈을 가진 VIDEO ROOM 고양이 직원"
        fill
        priority={priority}
        sizes="240px"
        src="/images/staff-cat.png"
      />
    </span>
  );
}

export function VhsTape({
  className,
  code = 'VR-000',
  label = '준비중',
  orientation = 'vertical',
}: VhsTapeProps) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.vhsTape} ${orientation === 'horizontal' ? styles.horizontalTape : ''} ${className ?? ''}`}
      data-orientation={orientation}>
      <Image
        alt=""
        className={styles.vhsImage}
        fill
        sizes="(max-width: 520px) 360px, 680px"
        src="/images/vhs-tape.png"
      />
      <span className={styles.vhsLabel}>
        <strong>{label}</strong>
        <small>{code}</small>
      </span>
    </span>
  );
}

export function VideoCase({
  className,
  runtime,
  thumbnailUrl,
  title,
}: VideoCaseProps) {
  return (
    <span className={`${styles.videoCase} ${className ?? ''}`}>
      <span className={styles.caseSpine}>{title}</span>
      {thumbnailUrl ? (
        <span
          aria-label={`${title} 비디오 표지`}
          className={styles.caseArtwork}
          role="img"
          style={{ backgroundImage: `url(${thumbnailUrl})` }}>
          <span className={styles.caseShade} />
          <strong>{title}</strong>
          {runtime ? <small>{runtime}</small> : null}
        </span>
      ) : (
        <VhsTape code="VR-NEW" label="준비중" />
      )}
    </span>
  );
}
