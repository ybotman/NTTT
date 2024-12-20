//------------------------------------------------------------
// src/utils/scoring.js
//------------------------------------------------------------
export function calculateMaxScore(timeLimit) {
  return 500 - ((timeLimit - 3) / 12) * 450;
}

export function calculateDecrementPerInterval(maxScore, timeLimit) {
  return maxScore / (timeLimit * 10);
}
