'use client';

import { useState, useEffect } from 'react';
import styles from './SearchFilters.module.css';
import { BLOOD_GROUPS } from '@/data/seedDonors';
import { BANGLADESH_DATA } from '@/data/bangladeshData';

const ALL_GROUPS = ['All', ...BLOOD_GROUPS];

export default function SearchFilters({ filters, onFilterChange }) {
  const [districtsList, setDistrictsList] = useState([]);
  const [areasList, setAreasList] = useState([]);

  // Sync list of districts and areas when filters change
  useEffect(() => {
    const div = filters.division;
    const dist = filters.district;

    if (div && div !== 'all' && BANGLADESH_DATA[div]) {
      setDistrictsList(Object.keys(BANGLADESH_DATA[div].districts));
      if (dist && dist !== 'all' && BANGLADESH_DATA[div].districts[dist]) {
        setAreasList(BANGLADESH_DATA[div].districts[dist]);
      } else {
        setAreasList([]);
      }
    } else {
      setDistrictsList([]);
      setAreasList([]);
    }
  }, [filters.division, filters.district]);

  const handleBloodGroup = (group) => {
    onFilterChange({
      ...filters,
      bloodGroup: group === 'All' ? 'all' : group,
    });
  };

  const handleDivision = (e) => {
    onFilterChange({
      ...filters,
      division: e.target.value,
      district: 'all',
      area: 'all',
    });
  };

  const handleDistrict = (e) => {
    onFilterChange({
      ...filters,
      district: e.target.value,
      area: 'all',
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
      division: 'all',
      district: 'all',
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
  if (filters.division && filters.division !== 'all') {
    activeChips.push({ label: `Division: ${filters.division}`, key: 'division' });
  }
  if (filters.district && filters.district !== 'all') {
    activeChips.push({ label: `District: ${filters.district}`, key: 'district' });
  }
  if (filters.area && filters.area !== 'all') {
    activeChips.push({ label: `Area: ${filters.area}`, key: 'area' });
  }
  if (filters.availableOnly) {
    activeChips.push({ label: 'Available Only', key: 'availableOnly' });
  }
  if (filters.eligibleOnly) {
    activeChips.push({ label: 'Eligible Only', key: 'eligibleOnly' });
  }

  const removeChip = (key) => {
    if (key === 'bloodGroup') {
      onFilterChange({ ...filters, bloodGroup: 'all' });
    } else if (key === 'division') {
      onFilterChange({ ...filters, division: 'all', district: 'all', area: 'all' });
    } else if (key === 'district') {
      onFilterChange({ ...filters, district: 'all', area: 'all' });
    } else if (key === 'area') {
      onFilterChange({ ...filters, area: 'all' });
    } else {
      onFilterChange({ ...filters, [key]: false });
    }
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

      {/* Chained location dropdowns */}
      <div className={styles.locationGroup}>
        {/* Division Dropdown */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Division</label>
          <select
            className={styles.select}
            value={filters.division || 'all'}
            onChange={handleDivision}
          >
            <option value="all">All Divisions</option>
            {Object.keys(BANGLADESH_DATA).map((div) => (
              <option key={div} value={div}>
                {div}
              </option>
            ))}
          </select>
        </div>

        {/* District Dropdown */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>District</label>
          <select
            className={styles.select}
            value={filters.district || 'all'}
            onChange={handleDistrict}
            disabled={!filters.division || filters.division === 'all'}
          >
            <option value="all">All Districts</option>
            {districtsList.map((dist) => (
              <option key={dist} value={dist}>
                {dist}
              </option>
            ))}
          </select>
        </div>

        {/* Area Dropdown */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Area</label>
          <select
            className={styles.select}
            value={filters.area || 'all'}
            onChange={handleArea}
            disabled={!filters.district || filters.district === 'all'}
          >
            <option value="all">All Areas</option>
            {areasList.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>
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
