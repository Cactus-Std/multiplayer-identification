import { describe, expect, it } from 'vitest';
import { PredictionStabilizer } from './predictionStabilizer';

describe('PredictionStabilizer', () => {
  it('requires four matching predictions in a five-item window', () => {
    const stabilizer = new PredictionStabilizer();
    stabilizer.update('jack', 0);
    stabilizer.update('jack', 100);
    stabilizer.update(null, 200);
    stabilizer.update('jack', 300);
    expect(stabilizer.update('jack', 400)).toEqual({
      playerId: 'jack',
      changed: true,
    });
  });

  it('clears identity after one second without a valid prediction', () => {
    const stabilizer = new PredictionStabilizer();
    for (let index = 0; index < 4; index += 1) stabilizer.update('jack', index);
    expect(stabilizer.update(null, 1_004)).toEqual({
      playerId: null,
      changed: true,
    });
  });

  it('does not keep an old identity alive with unrelated predictions', () => {
    const stabilizer = new PredictionStabilizer();
    for (let index = 0; index < 4; index += 1) stabilizer.update('jack', index);
    stabilizer.update('amy', 200);
    stabilizer.update('sam', 500);
    stabilizer.update('amy', 800);
    expect(stabilizer.update('sam', 1_004)).toEqual({
      playerId: null,
      changed: true,
    });
  });
});
