import styles from './BloodGroupBadge.module.css';

export default function BloodGroupBadge({ group, size = 'md' }) {
  return (
    <span className={`${styles.badge} ${styles[size]}`}>
      {group}
    </span>
  );
}
