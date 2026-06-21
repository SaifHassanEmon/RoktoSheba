'use client';

import styles from './SearchFilters.module.css';
import { BLOOD_GROUPS, DHAKA_AREAS } from '@/data/seedDonors';

const ALL_GROUPS = ['All', ...BLOOD_GROUPS];

export default function SearchFilters({ filters, onFilterChange }) {
  const handleBloodGroup = (group) => {
    onFilterChange({
      ...filters,
      bloodGroup: group === 'All' ? 'all' : group,
    });
  };

  const handleArea = (e) => {
    onFilterChange({
      ...filters,
      area: e.target.value,
    });
  };

  const handleToggle = (key) => {
    onFilterChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  const clearAll = () => {
    onFilterChange({
      bloodGroup: 'all',
      area: 'all',
      availableOnly: false,
      eligibleOnly: false,
    });
  };

  // Collect active filter chips
  const activeChips = [];
  if (filters.bloodGroup && filters.bloodGroup !== 'all') {
    activeChips.push({ label: filters.bloodGroup, key: 'bloodGroup' });
  }
  if (filters.area && filters.area !== 'all') {
    activeChips.push({ label: filters.area, key: 'area' });
  }
  if (filters.availableOnly) {
    activeChips.push({ label: 'Available Only', key: 'availableOnly' });
  }
  if (filters.eligibleOnly) {
    activeChips.push({ label: 'Eligible Only', key: 'eligibleOnly' });
  }

  const removeChip = (key) => {
    if (key === 'bloodGroup') onFilterChange({ ...filters, bloodGroup: 'all' });
    else if (key === 'area') onFilterChange({ ...filters, area: 'all' });
    else onFilterChange({ ...filters, [key]: false });
  };

  return (
    <div className={styles.wrapper}>
      {/* Blood group buttons */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Blood Group</label>
        <div className={styles.bloodButtons}>
          {ALL_GROUPS.map((group) => {
            const isActive =
              group === 'All'
                ? !filters.bloodGroup || filters.bloodGroup === 'all'
                : filters.bloodGroup === group;
            return (
              <button
                key={group}
                className={`${styles.bloodBtn} ${isActive ? styles.bloodBtnActive : ''}`}
                onClick={() => handleBloodGroup(group)}
              >
                {group}
              </button>
            );
          })}
        </div>
      </div>

      {/* Area dropdown */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Area</label>
        <select
          className={styles.select}
          value={filters.area || 'all'}
          onChange={handleArea}
        >
          <option value="all">All Areas</option>
          {DHAKA_AREAS.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </div>

      {/* Toggles */}
      <div className={styles.toggleRow}>
        <label className={styles.toggle}>
          <span className={styles.toggleLabel}>Available Only</span>
          <button
            type="button"
            role="switch"
            aria-checked={!!filters.availableOnly}
            className={`${styles.switch} ${filters.availableOnly ? styles.switchOn : ''}`}
            onClick={() => handleToggle('availableOnly')}
          >
            <span className={styles.switchThumb} />
          </button>
        </label>

        <label className={styles.toggle}>
          <span className={styles.toggleLabel}>Eligible Only</span>
          <button
            type="button"
            role="switch"
            aria-checked={!!filters.eligibleOnly}
            className={`${styles.switch} ${filters.eligibleOnly ? styles.switchOn : ''}`}
            onClick={() => handleToggle('eligibleOnly')}
          >
            <span className={styles.switchThumb} />
          </button>
        </label>
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className={styles.chips}>
          {activeChips.map((chip) => (
            <span key={chip.key} className={styles.chip}>
              {chip.label}
              <button
                className={styles.chipRemove}
                onClick={() => removeChip(chip.key)}
                aria-label={`Remove ${chip.label} filter`}
              >
                ×
              </button>
            </span>
          ))}
          <button className={styles.clearAll} onClick={clearAll}>
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
