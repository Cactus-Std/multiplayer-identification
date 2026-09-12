import {
  IDENTITY_CLEAR_MS,
  PREDICTION_REQUIRED_MATCHES,
  PREDICTION_WINDOW_SIZE,
} from './config';

export interface StabilizedPrediction {
  playerId: string | null;
  changed: boolean;
}

export class PredictionStabilizer {
  private readonly predictions: Array<string | null> = [];
  private readonly lastSeenByPlayer = new Map<string, number>();
  private stablePlayerId: string | null = null;

  update(
    playerId: string | null,
    timestamp = Date.now(),
  ): StabilizedPrediction {
    this.predictions.push(playerId);
    if (this.predictions.length > PREDICTION_WINDOW_SIZE) {
      this.predictions.shift();
    }
    if (playerId) this.lastSeenByPlayer.set(playerId, timestamp);

    const previousPlayerId = this.stablePlayerId;
    if (
      this.stablePlayerId &&
      timestamp - (this.lastSeenByPlayer.get(this.stablePlayerId) ?? 0) >=
        IDENTITY_CLEAR_MS
    ) {
      this.stablePlayerId = null;
      this.predictions.length = 0;
      return { playerId: null, changed: true };
    }

    const counts = new Map<string, number>();
    for (const prediction of this.predictions) {
      if (prediction) counts.set(prediction, (counts.get(prediction) ?? 0) + 1);
    }
    let winningPlayerId: string | null = null;
    let winningCount = 0;
    for (const [candidateId, count] of counts) {
      if (count > winningCount) {
        winningPlayerId = candidateId;
        winningCount = count;
      }
    }

    if (winningPlayerId && winningCount >= PREDICTION_REQUIRED_MATCHES) {
      this.stablePlayerId = winningPlayerId;
    }

    return {
      playerId: this.stablePlayerId,
      changed: previousPlayerId !== this.stablePlayerId,
    };
  }

  reset(): void {
    this.predictions.length = 0;
    this.lastSeenByPlayer.clear();
    this.stablePlayerId = null;
  }
}
