# Trivia Scoring Bug Fix

## Problems Fixed

### 1. Wrong-Question Attribution
**Issue**: When a player answered correctly on Q2, the result screen showed Q2: +0 (wrong) and Q3: +50 (correct), even though they only answered Q2 correctly and Q3 was not yet played.

**Root Cause**: The `answersHistory` array was being updated with `response.isCorrect` immediately after receiving the API response, but the UI was still displaying the OLD question while showing feedback. The answer was being recorded against the NEXT question's index, not the current one.

**Fix**: Changed from tracking `answersHistory` (boolean array) to `questionScores` (number array). Now when we call `setQuestionScores((prev) => [...prev, response.pointsEarned])`, it records the points for the question CURRENTLY on screen, before advancing to the next question.

### 2. Total Doesn't Match Per-Question Breakdown
**Issue**: The three per-question cards showed 0 + 0 + 50 = 50 pts, but the "Total Points Earned" showed +100.

**Root Cause**: The per-question cards displayed hardcoded "+50" for correct and "+0" for wrong, while the total was accumulated from `totalScore` which tracked actual `response.pointsEarned` values. These two data sources could drift apart.

**Fix**: 
- Removed `totalScore` state entirely
- Changed `StageCleared` to receive `questionScores` (array of actual points per question)
- Display actual points earned in each Q card (not hardcoded 50/0)
- Calculate total from `scores.reduce((sum, score) => sum + score, 0)` - **single source of truth**

## Changes Made

### `trivia-flow.tsx`
- ❌ Removed: `totalScore` state and `answersHistory` (boolean array)
- ✅ Added: `questionScores` state (number array)
- ✅ Changed: Record `response.pointsEarned` immediately after answer submission (before advancing to next question)
- ✅ Changed: Calculate running total from `questionScores.reduce()` when needed
- ✅ Changed: Pass `questionScores` to `StageCleared` component

### `stage-cleared.tsx`
- ❌ Removed: `questionResults` prop (boolean array)
- ✅ Added: `questionScores` prop (number array)
- ✅ Changed: Display actual points in each Q card (not hardcoded +50/+0)
- ✅ Changed: Calculate total from summing `questionScores` array
- ✅ Added: Comment indicating total is calculated from per-question scores to ensure consistency

## Manual Test Case

**Scenario**: Timeout on Q1, correct on Q2, correct on Q3

1. Start a trivia game
2. **Q1**: Let timer hit 0 without selecting any answer (timeout)
   - Should show "⏰ Time's up! +0 pts" 
   - Correct answer highlighted in green
   - No option marked as selected by user
3. Click Continue
4. **Q2**: Select correct answer before timer expires
   - Should show "Correct! +50 pts" in green
5. Click Continue  
6. **Q3**: Select correct answer before timer expires
   - Should show "Correct! +50 pts" in green
7. Click Continue
8. **Game Over Screen** should show:
   - "You got 2 out of 3 correct"
   - Q1: +0 (red background)
   - Q2: +50 (green background)
   - Q3: +50 (green background)
   - Total Points Earned: +100

**All three numbers must match**: Q1 + Q2 + Q3 = Total

## Why This Fix is Correct

1. **Single source of truth**: All scoring now comes from the `questionScores` array
2. **Correct timing**: Points are recorded when the answer is submitted, for the question currently displayed
3. **Consistency guaranteed**: Total is mathematically derived from per-question scores, cannot drift
4. **Flexible**: Works with any point values the backend returns (not hardcoded to 50/0)

## Testing Checklist

- [ ] Timeout on Q1, correct on Q2, correct on Q3 → shows 0, 50, 50, total 100
- [ ] All three correct → shows 50, 50, 50, total 150  
- [ ] All three wrong → shows 0, 0, 0, total 0
- [ ] Wrong on Q1, timeout on Q2, correct on Q3 → shows 0, 0, 50, total 50
- [ ] Verify "X out of 3 correct" matches the number of green cards
- [ ] Verify total always equals sum of three cards
