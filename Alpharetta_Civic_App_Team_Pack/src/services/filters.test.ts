import { filterIssues, isFiltering, matchesQuery, statusesIn, topicsIn } from './filters';
import { mockDataset } from '../test/mockDataset';

const issues = mockDataset.issues;

describe('filters', () => {
  it('matches every query word, case-insensitively, across fields', () => {
    expect(matchesQuery('ROAD study', 'Sample Road Corridor Study')).toBe(true);
    expect(matchesQuery('road park', 'Sample Road Corridor Study')).toBe(false);
    expect(matchesQuery('   ', 'anything')).toBe(true);
    expect(matchesQuery('x', null, undefined)).toBe(false);
  });

  it('combines keyword, topic, and status', () => {
    expect(filterIssues(issues, { q: '', topic: 'transportation', status: '' }).map((i) => i.id)).toEqual(['issue-mock-001', 'issue-mock-005']);
    expect(filterIssues(issues, { q: '', topic: 'transportation', status: 'proposed' }).map((i) => i.id)).toEqual(['issue-mock-005']);
    expect(filterIssues(issues, { q: 'land-use', topic: '', status: '' }).map((i) => i.id)).toEqual(['issue-mock-003']);
    expect(filterIssues(issues, { q: 'zoning', topic: '', status: '' }).map((i) => i.id)).toContain('issue-mock-003'); // category text is searchable
  });

  it('only offers topics and statuses that exist in the data', () => {
    expect(topicsIn(issues)).toEqual(['community_planning', 'development_and_zoning', 'parks_and_public_spaces', 'transportation']);
    expect(statusesIn(issues).sort()).toEqual(['proposed', 'under_consideration', 'unknown']);
    expect(isFiltering({ q: ' ', topic: '', status: '' })).toBe(false);
  });
});
