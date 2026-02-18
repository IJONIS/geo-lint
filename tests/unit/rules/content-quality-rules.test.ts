/**
 * Content Quality Rules Unit Tests
 * Tests for jargon density, content repetition, sentence length, and substance ratio rules.
 */

import { describe, it, expect } from 'vitest';
import { createItem, createContext } from '../../helpers.js';
import {
  jargonDensity,
  contentRepetition,
  sentenceLengthExtreme,
  substanceRatio,
} from '../../../src/rules/content-quality-rules.js';

const ctx = createContext();

// ─── jargonDensity ─────────────────────────────────────────────────────────

describe('jargonDensity', () => {
  it('skips short content (<300 words)', () => {
    const item = createItem({ body: 'A short post with methodology and paradigm.' });
    const results = jargonDensity.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('passes clean content', () => {
    const body = Array(100).fill(
      'This guide explains how to set up a blog with clear steps and practical examples.',
    ).join(' ');
    const item = createItem({ body });
    const results = jargonDensity.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns on moderate jargon density', () => {
    // Mix of jargon and normal words — aim for 8-15% jargon
    const normal = 'This section covers topics related to business operations and management practices.';
    const jargon = 'The comprehensive methodology paradigm systematization operationalization multifaceted transformational holistic.';
    const body = Array(20).fill(`${normal} ${jargon}`).join(' ');
    const item = createItem({ body });
    const results = jargonDensity.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('content-jargon-density');
  });

  it('errors on extreme jargon density', () => {
    const body = Array(50).fill(
      'The comprehensive methodology paradigm systematization operationalization interdisciplinary multifaceted transformational reconceptualize heterogeneous holistic ecosystem.',
    ).join(' ');
    const item = createItem({ body });
    const results = jargonDensity.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe('error');
  });
});

// ─── contentRepetition ─────────────────────────────────────────────────────

describe('contentRepetition', () => {
  it('skips short content', () => {
    const item = createItem({ body: 'A short repeated post.' });
    const results = contentRepetition.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('passes diverse content', () => {
    const sections = [
      'The first section discusses cooking techniques including grilling, baking, and sauteing with various herbs.',
      '',
      'Photography requires understanding of exposure, aperture, and shutter speed for capturing great images.',
      '',
      'Software development involves writing clean code, testing thoroughly, and deploying applications safely.',
      '',
      'Travel planning means researching destinations, booking flights, and creating detailed itineraries for trips.',
      '',
      'Gardening starts with preparing soil, selecting appropriate plants, and maintaining proper watering schedules.',
    ];
    // Pad to 300+ words
    const body = sections.join('\n') + ' ' + Array(200).fill('additional content here today').join(' ');
    const item = createItem({ body });
    const results = contentRepetition.run(item, ctx);
    // Should have no high-similarity violations
    const similarityViolations = results.filter(r => r.message.includes('paragraph similarity'));
    expect(similarityViolations).toHaveLength(0);
  });

  it('detects repetitive paragraphs', () => {
    const body = Array(20).fill(
      'The organizational infrastructure methodology paradigm represents comprehensive systematization of enterprise environments across heterogeneous computational architectures and multifaceted administrative hierarchies.',
    ).join('\n\n');
    const item = createItem({ body });
    const results = contentRepetition.run(item, ctx);
    expect(results.length).toBeGreaterThan(0);
  });
});

// ─── sentenceLengthExtreme ─────────────────────────────────────────────────

describe('sentenceLengthExtreme', () => {
  it('skips short content', () => {
    const item = createItem({ body: 'A very long sentence that goes on and on.' });
    const results = sentenceLengthExtreme.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('passes normal sentence lengths', () => {
    const body = Array(60).fill(
      'This is a normal sentence. It has about ten words in it.',
    ).join(' ');
    const item = createItem({ body });
    const results = sentenceLengthExtreme.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('warns on high average sentence length', () => {
    // Create sentences averaging ~40 words each
    const longSentence = Array(40).fill('word').join(' ') + '.';
    const body = Array(15).fill(longSentence).join(' ');
    const item = createItem({ body });
    const results = sentenceLengthExtreme.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('content-sentence-length-extreme');
  });

  it('errors on extreme average sentence length', () => {
    const longSentence = Array(70).fill('word').join(' ') + '.';
    const body = Array(10).fill(longSentence).join(' ');
    const item = createItem({ body });
    const results = sentenceLengthExtreme.run(item, ctx);
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe('error');
  });
});

// ─── substanceRatio ────────────────────────────────────────────────────────

describe('substanceRatio', () => {
  it('skips short content', () => {
    const item = createItem({ body: 'word word word word.' });
    const results = substanceRatio.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('passes content with diverse vocabulary', () => {
    const body = [
      'Cooking requires fresh tomatoes basil garlic olive oil and seasoning for delicious meals.',
      'Photography demands patience proper lighting composition aperture control and creative vision.',
      'Programming involves algorithms debugging testing deployment refactoring and code reviews.',
      'Gardening needs fertile soil sunlight watering pruning mulching and composting techniques.',
      'Travel means exploring cultures cuisines landscapes architecture traditions and local customs.',
      'Music blends rhythm melody harmony instruments vocals production and sound engineering.',
      'Science discovers through experiments hypotheses observations analysis peer review and publication.',
      'Literature explores emotions narratives characters themes symbolism metaphor and allegory.',
      'Mathematics provides logical frameworks equations proofs theorems calculations and modeling.',
      'Medicine combines diagnosis treatment prevention research pharmacology surgery and rehabilitation.',
      'Engineering designs bridges buildings circuits machines vehicles structures and infrastructure.',
      'History examines civilizations conflicts treaties inventions migrations revolutions and reforms.',
      'Philosophy questions existence morality knowledge consciousness language meaning and ethics.',
      'Economics studies markets trade inflation employment productivity regulation and fiscal policy.',
      'Psychology investigates behavior cognition development personality disorders therapy and wellness.',
      'Astronomy observes planets stars galaxies nebulae comets asteroids and cosmic phenomena.',
      'Biology classifies organisms ecosystems genetics evolution cells proteins and molecular pathways.',
      'Chemistry analyzes elements compounds reactions bonds catalysts polymers and crystalline structures.',
      'Linguistics examines syntax morphology phonetics semantics pragmatics and discourse patterns.',
      'Sociology explores institutions communities stratification inequality mobility and demographic trends.',
      'Anthropology studies kinship rituals artifacts languages migrations settlements and cultural exchange.',
      'Geology investigates minerals rocks fossils tectonic plates volcanoes erosion and sedimentation.',
      'Oceanography monitors currents tides salinity marine habitats coral reefs and hydrothermal vents.',
      'Meteorology forecasts precipitation temperature humidity barometric pressure wind patterns and storms.',
      'Ecology balances biodiversity conservation habitat restoration pollution control and sustainability.',
      'Veterinary medicine treats infections fractures parasites vaccinations nutrition and surgical procedures.',
      'Dentistry addresses cavities implants orthodontics periodontal disease root canals and prosthetics.',
      'Pharmacy develops formulations dosages interactions contraindications generics and clinical trials.',
      'Agriculture cultivates crops irrigation fertilization pest management rotation and harvesting techniques.',
      'Robotics integrates sensors actuators controllers algorithms kinematics dynamics and machine learning.',
    ].join(' ');
    const item = createItem({ body });
    const results = substanceRatio.run(item, ctx);
    expect(results).toHaveLength(0);
  });

  it('errors on extremely repetitive vocabulary', () => {
    const body = Array(100).fill(
      'organizational infrastructure methodology paradigm systematization comprehensive',
    ).join(' ');
    const item = createItem({ body });
    const results = substanceRatio.run(item, ctx);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].rule).toBe('content-substance-ratio');
    expect(results[0].severity).toBe('error');
  });
});
