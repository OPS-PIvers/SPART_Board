1. **Optimize QuizLiveMonitor `options.map` loop**
   - The `options.map` loop in `MCDistribution` re-filters `responses` multiple times (once for every option) to count answers. This is `O(N*M)` where `N` is options and `M` is responses.
   - We can precompute the answer counts using a map/dictionary before the loop, making it `O(N+M)`.

2. **Optimize QuizResults `buckets.map` loop**
   - The `buckets.map` loop in `OverviewTab` calls `getResponseScore(r, questions)` inside a `filter` for every bucket. Since `getResponseScore` loops over all answers and all questions, this is very inefficient.
   - We should pre-calculate the scores for all completed responses once (e.g., using `useMemo` or just a simple array map since it's inside a component) before bucket filtering, changing it from `O(B*R*Q)` to `O(R*Q + B*R)`.
   - Also, `OverviewTab` calls `completed.map` inside `buckets.map`? Wait, let's just precalculate `completedScores = completed.map(r => getResponseScore(r, questions))` and then bucket them.

3. **Run Pre-Commit Checks**
   - Complete pre commit steps to make sure proper testing, verifications, reviews and reflections are done.
4. **Optimize QuizResults `questions.map` loop**
   - The `questions.map` loop in `QuestionsTab` iterates over `responses.filter` and inside that does `.some` over answers, making it `O(Q*R*A)`.
   - We can pre-calculate the counts of "answered" and "correct" per question by iterating over all responses once and reducing the counts into a dictionary `O(R*A)`, then simply using `map` `O(Q)`.

5. **Submit PR**
   - Wait for pre-commit tests to pass. Submit with performance comments and standard PR message structure.
