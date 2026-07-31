import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptCrowdsourcedRecord,
  findExactCrowdsourcedMatch,
  normalizeEnglishText,
  selectLookupCandidateRecords,
} from './crowdsourcedLookup';

test('normalizes casing, whitespace and apostrophes for exact matching', () => {
  assert.equal(normalizeEnglishText('  I\'m happy   today!  '), "i'm happy today");
  assert.equal(normalizeEnglishText('  Please   wait   for me  '), 'please wait for me');
});

test('adapts Firestore records with flexible field names and preserves output', () => {
  const record = adaptCrowdsourcedRecord('doc-1', {
    promptEnglish: 'How are you?',
    tm_romanized: 'Tu kasa aahe?',
    tm_devanagari: 'तू कसा आहे?',
    status: 'approved',
  });

  assert.ok(record);
  assert.equal(record?.englishNormalized, 'how are you');
  assert.equal(record?.romanisedText, 'Tu kasa aahe?');
  assert.equal(record?.devanagariText, 'तू कसा आहे?');
});

test('finds the best approved exact match from duplicate English prompts', () => {
  const records = [
    adaptCrowdsourcedRecord('doc-1', {
      promptEnglish: 'Hello there',
      romanisedText: 'Namaskar',
      devanagariText: 'नमस्कार',
      status: 'pending',
    }),
    adaptCrowdsourcedRecord('doc-2', {
      promptEnglish: 'Hello there',
      romanisedText: 'Namaskar',
      devanagariText: 'नमस्कार',
      status: 'approved',
    }),
  ].filter(Boolean);

  const match = findExactCrowdsourcedMatch('Hello there', records as any);
  assert.ok(match);
  assert.equal(match?.id, 'doc-2');
});

test('keeps pending community contributions available for lookup', () => {
  const pendingRecord = adaptCrowdsourcedRecord('doc-pending', {
    promptEnglish: 'Please wait',
    romanisedText: 'कृपया वाट पाहा',
    devanagariText: 'कृपया वाट पाहा',
    status: 'pending',
  });

  assert.ok(pendingRecord);
  const candidates = selectLookupCandidateRecords([pendingRecord as any]);
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.id, 'doc-pending');
});
