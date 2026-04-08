import type { CurriculumInfo } from '../types';

// GTCI curriculum data - mirrors lib/curriculum.ts
// Full DesignGurus course: 244 problems across 30 sections.
// This array contains ~235 unique problems (cross-section duplicates excluded).

interface CurriculumProblem {
  title: string;
  normalizedTitle: string;
  difficulty: 'easy' | 'medium' | 'hard';
  patternKey: string;
  index: number;
}

// Pre-normalized curriculum data
const GTCI_CURRICULUM: CurriculumProblem[] = [
  // Warmup
  { title: 'Contains Duplicate', normalizedTitle: 'contains-duplicate', difficulty: 'easy', patternKey: 'warmup', index: 0 },
  { title: 'Pangram', normalizedTitle: 'pangram', difficulty: 'easy', patternKey: 'warmup', index: 1 },
  { title: 'Reverse Vowels', normalizedTitle: 'reverse-vowels', difficulty: 'easy', patternKey: 'warmup', index: 2 },
  { title: 'Valid Palindrome', normalizedTitle: 'valid-palindrome', difficulty: 'easy', patternKey: 'warmup', index: 3 },
  { title: 'Valid Anagram', normalizedTitle: 'valid-anagram', difficulty: 'easy', patternKey: 'warmup', index: 4 },
  { title: 'Shortest Word Distance', normalizedTitle: 'shortest-word-distance', difficulty: 'easy', patternKey: 'warmup', index: 5 },
  { title: 'Number of Good Pairs', normalizedTitle: 'number-of-good-pairs', difficulty: 'easy', patternKey: 'warmup', index: 6 },
  { title: 'Sqrt', normalizedTitle: 'sqrt', difficulty: 'medium', patternKey: 'warmup', index: 7 },

  // Two Pointers
  { title: 'Pair with Target Sum', normalizedTitle: 'pair-with-target-sum', difficulty: 'easy', patternKey: 'two-pointers', index: 0 },
  { title: 'Find Non-Duplicate Number Instances', normalizedTitle: 'find-non-duplicate-number-instances', difficulty: 'easy', patternKey: 'two-pointers', index: 1 },
  { title: 'Squaring a Sorted Array', normalizedTitle: 'squaring-a-sorted-array', difficulty: 'easy', patternKey: 'two-pointers', index: 2 },
  { title: 'Triplet Sum to Zero', normalizedTitle: 'triplet-sum-to-zero', difficulty: 'medium', patternKey: 'two-pointers', index: 3 },
  { title: 'Triplet Sum Close to Target', normalizedTitle: 'triplet-sum-close-to-target', difficulty: 'medium', patternKey: 'two-pointers', index: 4 },
  { title: 'Triplets with Smaller Sum', normalizedTitle: 'triplets-with-smaller-sum', difficulty: 'medium', patternKey: 'two-pointers', index: 5 },
  { title: 'Dutch National Flag Problem', normalizedTitle: 'dutch-national-flag-problem', difficulty: 'medium', patternKey: 'two-pointers', index: 6 },
  { title: 'Quadruple Sum to Target', normalizedTitle: 'quadruple-sum-to-target', difficulty: 'medium', patternKey: 'two-pointers', index: 7 },
  { title: 'Comparing Strings containing Backspaces', normalizedTitle: 'comparing-strings-containing-backspaces', difficulty: 'medium', patternKey: 'two-pointers', index: 8 },
  { title: 'Minimum Window Sort', normalizedTitle: 'minimum-window-sort', difficulty: 'medium', patternKey: 'two-pointers', index: 9 },

  // Fast Slow Pointers
  { title: 'LinkedList Cycle', normalizedTitle: 'linkedlist-cycle', difficulty: 'easy', patternKey: 'fast-slow-pointers', index: 0 },
  { title: 'Middle of the LinkedList', normalizedTitle: 'middle-of-the-linkedlist', difficulty: 'easy', patternKey: 'fast-slow-pointers', index: 1 },
  { title: 'Start of LinkedList Cycle', normalizedTitle: 'start-of-linkedlist-cycle', difficulty: 'medium', patternKey: 'fast-slow-pointers', index: 2 },
  { title: 'Happy Number', normalizedTitle: 'happy-number', difficulty: 'medium', patternKey: 'fast-slow-pointers', index: 3 },
  { title: 'Palindrome LinkedList', normalizedTitle: 'palindrome-linkedlist', difficulty: 'medium', patternKey: 'fast-slow-pointers', index: 4 },
  { title: 'Rearrange a LinkedList', normalizedTitle: 'rearrange-a-linkedlist', difficulty: 'medium', patternKey: 'fast-slow-pointers', index: 5 },
  { title: 'Cycle in a Circular Array', normalizedTitle: 'cycle-in-a-circular-array', difficulty: 'hard', patternKey: 'fast-slow-pointers', index: 6 },

  // Sliding Window
  { title: 'Maximum Sum Subarray of Size K', normalizedTitle: 'maximum-sum-subarray-of-size-k', difficulty: 'easy', patternKey: 'sliding-window', index: 0 },
  { title: 'Smallest Subarray With a Greater Sum', normalizedTitle: 'smallest-subarray-with-a-greater-sum', difficulty: 'easy', patternKey: 'sliding-window', index: 1 },
  { title: 'Longest Substring with K Distinct Characters', normalizedTitle: 'longest-substring-with-k-distinct-characters', difficulty: 'medium', patternKey: 'sliding-window', index: 2 },
  { title: 'Fruits into Baskets', normalizedTitle: 'fruits-into-baskets', difficulty: 'medium', patternKey: 'sliding-window', index: 3 },
  { title: 'Longest Substring with Same Letters after Replacement', normalizedTitle: 'longest-substring-with-same-letters-after-replacement', difficulty: 'hard', patternKey: 'sliding-window', index: 4 },
  { title: 'Longest Subarray with Ones after Replacement', normalizedTitle: 'longest-subarray-with-ones-after-replacement', difficulty: 'hard', patternKey: 'sliding-window', index: 5 },
  { title: 'Permutation in a String', normalizedTitle: 'permutation-in-a-string', difficulty: 'hard', patternKey: 'sliding-window', index: 6 },
  { title: 'String Anagrams', normalizedTitle: 'string-anagrams', difficulty: 'hard', patternKey: 'sliding-window', index: 7 },
  { title: 'Smallest Window containing Substring', normalizedTitle: 'smallest-window-containing-substring', difficulty: 'hard', patternKey: 'sliding-window', index: 8 },
  { title: 'Words Concatenation', normalizedTitle: 'words-concatenation', difficulty: 'hard', patternKey: 'sliding-window', index: 9 },
  { title: 'Counting Subarrays with Product Less than a Target', normalizedTitle: 'counting-subarrays-with-product-less-than-a-target', difficulty: 'hard', patternKey: 'sliding-window', index: 10 },
  { title: 'Subarrays with Product Less than a Target', normalizedTitle: 'subarrays-with-product-less-than-a-target', difficulty: 'hard', patternKey: 'sliding-window', index: 11 },

  // Merge Intervals
  { title: 'Merge Intervals', normalizedTitle: 'merge-intervals', difficulty: 'medium', patternKey: 'merge-intervals', index: 0 },
  { title: 'Insert Interval', normalizedTitle: 'insert-interval', difficulty: 'medium', patternKey: 'merge-intervals', index: 1 },
  { title: 'Intervals Intersection', normalizedTitle: 'intervals-intersection', difficulty: 'medium', patternKey: 'merge-intervals', index: 2 },
  { title: 'Conflicting Appointments', normalizedTitle: 'conflicting-appointments', difficulty: 'medium', patternKey: 'merge-intervals', index: 3 },
  { title: 'Minimum Meeting Rooms', normalizedTitle: 'minimum-meeting-rooms', difficulty: 'hard', patternKey: 'merge-intervals', index: 4 },
  { title: 'Maximum CPU Load', normalizedTitle: 'maximum-cpu-load', difficulty: 'hard', patternKey: 'merge-intervals', index: 5 },
  { title: 'Employee Free Time', normalizedTitle: 'employee-free-time', difficulty: 'hard', patternKey: 'merge-intervals', index: 6 },

  // Cyclic Sort
  { title: 'Cyclic Sort', normalizedTitle: 'cyclic-sort', difficulty: 'easy', patternKey: 'cyclic-sort', index: 0 },
  { title: 'Find the Missing Number', normalizedTitle: 'find-the-missing-number', difficulty: 'easy', patternKey: 'cyclic-sort', index: 1 },
  { title: 'Find all Missing Numbers', normalizedTitle: 'find-all-missing-numbers', difficulty: 'easy', patternKey: 'cyclic-sort', index: 2 },
  { title: 'Find the Duplicate Number', normalizedTitle: 'find-the-duplicate-number', difficulty: 'easy', patternKey: 'cyclic-sort', index: 3 },
  { title: 'Find all Duplicate Numbers', normalizedTitle: 'find-all-duplicate-numbers', difficulty: 'easy', patternKey: 'cyclic-sort', index: 4 },
  { title: 'Find the Corrupt Pair', normalizedTitle: 'find-the-corrupt-pair', difficulty: 'easy', patternKey: 'cyclic-sort', index: 5 },
  { title: 'Find the Smallest Missing Positive Number', normalizedTitle: 'find-the-smallest-missing-positive-number', difficulty: 'medium', patternKey: 'cyclic-sort', index: 6 },
  { title: 'Find the First K Missing Positive Numbers', normalizedTitle: 'find-the-first-k-missing-positive-numbers', difficulty: 'hard', patternKey: 'cyclic-sort', index: 7 },

  // Linked List Reversal
  { title: 'Reverse a LinkedList', normalizedTitle: 'reverse-a-linkedlist', difficulty: 'easy', patternKey: 'linked-list-reversal', index: 0 },
  { title: 'Reverse a Sub-list', normalizedTitle: 'reverse-a-sub-list', difficulty: 'medium', patternKey: 'linked-list-reversal', index: 1 },
  { title: 'Reverse every K-element Sub-list', normalizedTitle: 'reverse-every-k-element-sub-list', difficulty: 'medium', patternKey: 'linked-list-reversal', index: 2 },
  { title: 'Reverse alternating K-element Sub-list', normalizedTitle: 'reverse-alternating-k-element-sub-list', difficulty: 'medium', patternKey: 'linked-list-reversal', index: 3 },
  { title: 'Rotate a LinkedList', normalizedTitle: 'rotate-a-linkedlist', difficulty: 'medium', patternKey: 'linked-list-reversal', index: 4 },

  // Stack
  { title: 'Reverse a String', normalizedTitle: 'reverse-a-string', difficulty: 'easy', patternKey: 'stack', index: 0 },
  { title: 'Decimal to Binary Conversion', normalizedTitle: 'decimal-to-binary-conversion', difficulty: 'medium', patternKey: 'stack', index: 1 },
  { title: 'Next Greater Element', normalizedTitle: 'next-greater-element', difficulty: 'easy', patternKey: 'stack', index: 2 },
  { title: 'Sorting a Stack', normalizedTitle: 'sorting-a-stack', difficulty: 'easy', patternKey: 'stack', index: 3 },
  { title: 'Simplify Path', normalizedTitle: 'simplify-path', difficulty: 'medium', patternKey: 'stack', index: 4 },

  // Monotonic Stack
  { title: 'Remove Nodes From Linked List', normalizedTitle: 'remove-nodes-from-linked-list', difficulty: 'easy', patternKey: 'monotonic-stack', index: 0 },
  { title: 'Remove All Adjacent Duplicates In String', normalizedTitle: 'remove-all-adjacent-duplicates-in-string', difficulty: 'easy', patternKey: 'monotonic-stack', index: 1 },
  { title: 'Daily Temperatures', normalizedTitle: 'daily-temperatures', difficulty: 'easy', patternKey: 'monotonic-stack', index: 2 },
  { title: 'Remove All Adjacent Duplicates in String II', normalizedTitle: 'remove-all-adjacent-duplicates-in-string-ii', difficulty: 'medium', patternKey: 'monotonic-stack', index: 3 },
  { title: 'Sum of Subarray Minimums', normalizedTitle: 'sum-of-subarray-minimums', difficulty: 'medium', patternKey: 'monotonic-stack', index: 4 },
  { title: 'Remove K Digits', normalizedTitle: 'remove-k-digits', difficulty: 'hard', patternKey: 'monotonic-stack', index: 5 },

  // Level Order Traversal
  { title: 'Find Largest Value in Each Tree Row', normalizedTitle: 'find-largest-value-in-each-tree-row', difficulty: 'medium', patternKey: 'level-order-traversal', index: 0 },
  { title: 'Maximum Width of Binary Tree', normalizedTitle: 'maximum-width-of-binary-tree', difficulty: 'medium', patternKey: 'level-order-traversal', index: 1 },
  { title: 'Maximum Level Sum of a Binary Tree', normalizedTitle: 'maximum-level-sum-of-a-binary-tree', difficulty: 'medium', patternKey: 'level-order-traversal', index: 2 },
  { title: 'Even Odd Tree', normalizedTitle: 'even-odd-tree', difficulty: 'medium', patternKey: 'level-order-traversal', index: 3 },
  { title: 'N-ary Tree Level Order Traversal', normalizedTitle: 'nary-tree-level-order-traversal', difficulty: 'hard', patternKey: 'level-order-traversal', index: 4 },

  // Tree BFS
  { title: 'Binary Tree Level Order Traversal', normalizedTitle: 'binary-tree-level-order-traversal', difficulty: 'easy', patternKey: 'tree-bfs', index: 0 },
  { title: 'Reverse Level Order Traversal', normalizedTitle: 'reverse-level-order-traversal', difficulty: 'easy', patternKey: 'tree-bfs', index: 1 },
  { title: 'Zigzag Traversal', normalizedTitle: 'zigzag-traversal', difficulty: 'medium', patternKey: 'tree-bfs', index: 2 },
  { title: 'Level Averages in a Binary Tree', normalizedTitle: 'level-averages-in-a-binary-tree', difficulty: 'easy', patternKey: 'tree-bfs', index: 3 },
  { title: 'Minimum Depth of a Binary Tree', normalizedTitle: 'minimum-depth-of-a-binary-tree', difficulty: 'easy', patternKey: 'tree-bfs', index: 4 },
  { title: 'Level Order Successor', normalizedTitle: 'level-order-successor', difficulty: 'easy', patternKey: 'tree-bfs', index: 5 },
  { title: 'Connect Level Order Siblings', normalizedTitle: 'connect-level-order-siblings', difficulty: 'medium', patternKey: 'tree-bfs', index: 6 },
  { title: 'Connect All Level Order Siblings', normalizedTitle: 'connect-all-level-order-siblings', difficulty: 'medium', patternKey: 'tree-bfs', index: 7 },
  { title: 'Right View of a Binary Tree', normalizedTitle: 'right-view-of-a-binary-tree', difficulty: 'easy', patternKey: 'tree-bfs', index: 8 },

  // Tree DFS
  { title: 'Binary Tree Path Sum', normalizedTitle: 'binary-tree-path-sum', difficulty: 'easy', patternKey: 'tree-dfs', index: 0 },
  { title: 'All Paths for a Sum', normalizedTitle: 'all-paths-for-a-sum', difficulty: 'medium', patternKey: 'tree-dfs', index: 1 },
  { title: 'Sum of Path Numbers', normalizedTitle: 'sum-of-path-numbers', difficulty: 'medium', patternKey: 'tree-dfs', index: 2 },
  { title: 'Path With Given Sequence', normalizedTitle: 'path-with-given-sequence', difficulty: 'medium', patternKey: 'tree-dfs', index: 3 },
  { title: 'Count Paths for a Sum', normalizedTitle: 'count-paths-for-a-sum', difficulty: 'medium', patternKey: 'tree-dfs', index: 4 },
  { title: 'Tree Diameter', normalizedTitle: 'tree-diameter', difficulty: 'medium', patternKey: 'tree-dfs', index: 5 },
  { title: 'Path with Maximum Sum', normalizedTitle: 'path-with-maximum-sum', difficulty: 'hard', patternKey: 'tree-dfs', index: 6 },

  // Graph
  { title: 'Find if Path Exists in Graph', normalizedTitle: 'find-if-path-exists-in-graph', difficulty: 'easy', patternKey: 'graph', index: 0 },
  { title: 'Number of Provinces', normalizedTitle: 'number-of-provinces', difficulty: 'medium', patternKey: 'graph', index: 1 },
  { title: 'Find Eventual Safe States', normalizedTitle: 'find-eventual-safe-states', difficulty: 'medium', patternKey: 'graph', index: 2 },
  { title: 'Minimum Number of Vertices to Reach All Nodes', normalizedTitle: 'minimum-number-of-vertices-to-reach-all-nodes', difficulty: 'medium', patternKey: 'graph', index: 3 },
  { title: 'Bus Routes', normalizedTitle: 'bus-routes', difficulty: 'hard', patternKey: 'graph', index: 4 },

  // Islands
  { title: 'Number of Islands', normalizedTitle: 'number-of-islands', difficulty: 'easy', patternKey: 'islands', index: 0 },
  { title: 'Biggest Island', normalizedTitle: 'biggest-island', difficulty: 'easy', patternKey: 'islands', index: 1 },
  { title: 'Flood Fill', normalizedTitle: 'flood-fill', difficulty: 'easy', patternKey: 'islands', index: 2 },
  { title: 'Number of Closed Islands', normalizedTitle: 'number-of-closed-islands', difficulty: 'easy', patternKey: 'islands', index: 3 },
  { title: 'Problem Challenge 1', normalizedTitle: 'problem-challenge-1', difficulty: 'easy', patternKey: 'islands', index: 4 },
  { title: 'Problem Challenge 2', normalizedTitle: 'problem-challenge-2', difficulty: 'medium', patternKey: 'islands', index: 5 },
  { title: 'Problem Challenge 3', normalizedTitle: 'problem-challenge-3', difficulty: 'medium', patternKey: 'islands', index: 6 },

  // Two Heaps
  { title: 'Find the Median of a Number Stream', normalizedTitle: 'find-the-median-of-a-number-stream', difficulty: 'medium', patternKey: 'two-heaps', index: 0 },
  { title: 'Sliding Window Median', normalizedTitle: 'sliding-window-median', difficulty: 'hard', patternKey: 'two-heaps', index: 1 },
  { title: 'Maximize Capital', normalizedTitle: 'maximize-capital', difficulty: 'hard', patternKey: 'two-heaps', index: 2 },
  { title: 'Next Interval', normalizedTitle: 'next-interval', difficulty: 'hard', patternKey: 'two-heaps', index: 3 },

  // Subsets
  { title: 'Subsets', normalizedTitle: 'subsets', difficulty: 'easy', patternKey: 'subsets', index: 0 },
  { title: 'Subsets With Duplicates', normalizedTitle: 'subsets-with-duplicates', difficulty: 'easy', patternKey: 'subsets', index: 1 },
  { title: 'Permutations', normalizedTitle: 'permutations', difficulty: 'medium', patternKey: 'subsets', index: 2 },
  { title: 'String Permutations by changing case', normalizedTitle: 'string-permutations-by-changing-case', difficulty: 'medium', patternKey: 'subsets', index: 3 },
  { title: 'Balanced Parentheses', normalizedTitle: 'balanced-parentheses', difficulty: 'hard', patternKey: 'subsets', index: 4 },
  { title: 'Unique Generalized Abbreviations', normalizedTitle: 'unique-generalized-abbreviations', difficulty: 'hard', patternKey: 'subsets', index: 5 },
  { title: 'Evaluate Expression', normalizedTitle: 'evaluate-expression', difficulty: 'hard', patternKey: 'subsets', index: 6 },
  { title: 'Structurally Unique Binary Search Trees', normalizedTitle: 'structurally-unique-binary-search-trees', difficulty: 'hard', patternKey: 'subsets', index: 7 },
  { title: 'Count of Structurally Unique Binary Search Trees', normalizedTitle: 'count-of-structurally-unique-binary-search-trees', difficulty: 'hard', patternKey: 'subsets', index: 8 },

  // Binary Search
  { title: 'Order-agnostic Binary Search', normalizedTitle: 'order-agnostic-binary-search', difficulty: 'easy', patternKey: 'binary-search', index: 0 },
  { title: 'Ceiling of a Number', normalizedTitle: 'ceiling-of-a-number', difficulty: 'medium', patternKey: 'binary-search', index: 1 },
  { title: 'Next Letter', normalizedTitle: 'next-letter', difficulty: 'medium', patternKey: 'binary-search', index: 2 },
  { title: 'Number Range', normalizedTitle: 'number-range', difficulty: 'medium', patternKey: 'binary-search', index: 3 },
  { title: 'Search in a Sorted Infinite Array', normalizedTitle: 'search-in-a-sorted-infinite-array', difficulty: 'medium', patternKey: 'binary-search', index: 4 },
  { title: 'Minimum Difference Element', normalizedTitle: 'minimum-difference-element', difficulty: 'medium', patternKey: 'binary-search', index: 5 },
  { title: 'Bitonic Array Maximum', normalizedTitle: 'bitonic-array-maximum', difficulty: 'easy', patternKey: 'binary-search', index: 6 },
  { title: 'Search Bitonic Array', normalizedTitle: 'search-bitonic-array', difficulty: 'medium', patternKey: 'binary-search', index: 7 },
  { title: 'Search in Rotated Array', normalizedTitle: 'search-in-rotated-array', difficulty: 'medium', patternKey: 'binary-search', index: 8 },
  { title: 'Rotation Count', normalizedTitle: 'rotation-count', difficulty: 'medium', patternKey: 'binary-search', index: 9 },

  // Bitwise XOR
  { title: 'Single Number', normalizedTitle: 'single-number', difficulty: 'easy', patternKey: 'bitwise-xor', index: 0 },
  { title: 'Two Single Numbers', normalizedTitle: 'two-single-numbers', difficulty: 'medium', patternKey: 'bitwise-xor', index: 1 },
  { title: 'Complement of Base 10 Number', normalizedTitle: 'complement-of-base-10-number', difficulty: 'medium', patternKey: 'bitwise-xor', index: 2 },
  { title: 'Flip and Invert an Image', normalizedTitle: 'flip-and-invert-an-image', difficulty: 'hard', patternKey: 'bitwise-xor', index: 3 },

  // Top K Elements
  { title: 'Top K Numbers', normalizedTitle: 'top-k-numbers', difficulty: 'easy', patternKey: 'top-k-elements', index: 0 },
  { title: 'Kth Smallest Number', normalizedTitle: 'kth-smallest-number', difficulty: 'easy', patternKey: 'top-k-elements', index: 1 },
  { title: 'K Closest Points to the Origin', normalizedTitle: 'k-closest-points-to-the-origin', difficulty: 'easy', patternKey: 'top-k-elements', index: 2 },
  { title: 'Connect Ropes', normalizedTitle: 'connect-ropes', difficulty: 'easy', patternKey: 'top-k-elements', index: 3 },
  { title: 'Top K Frequent Numbers', normalizedTitle: 'top-k-frequent-numbers', difficulty: 'medium', patternKey: 'top-k-elements', index: 4 },
  { title: 'Frequency Sort', normalizedTitle: 'frequency-sort', difficulty: 'medium', patternKey: 'top-k-elements', index: 5 },
  { title: 'Kth Largest Number in a Stream', normalizedTitle: 'kth-largest-number-in-a-stream', difficulty: 'medium', patternKey: 'top-k-elements', index: 6 },
  { title: 'K Closest Numbers', normalizedTitle: 'k-closest-numbers', difficulty: 'medium', patternKey: 'top-k-elements', index: 7 },
  { title: 'Maximum Distinct Elements', normalizedTitle: 'maximum-distinct-elements', difficulty: 'medium', patternKey: 'top-k-elements', index: 8 },
  { title: 'Sum of Elements', normalizedTitle: 'sum-of-elements', difficulty: 'medium', patternKey: 'top-k-elements', index: 9 },
  { title: 'Rearrange String', normalizedTitle: 'rearrange-string', difficulty: 'hard', patternKey: 'top-k-elements', index: 10 },
  { title: 'Rearrange String K Distance Apart', normalizedTitle: 'rearrange-string-k-distance-apart', difficulty: 'hard', patternKey: 'top-k-elements', index: 11 },
  { title: 'Scheduling Tasks', normalizedTitle: 'scheduling-tasks', difficulty: 'hard', patternKey: 'top-k-elements', index: 12 },
  { title: 'Frequency Stack', normalizedTitle: 'frequency-stack', difficulty: 'hard', patternKey: 'top-k-elements', index: 13 },

  // K-Way Merge
  { title: 'Merge K Sorted Lists', normalizedTitle: 'merge-k-sorted-lists', difficulty: 'medium', patternKey: 'k-way-merge', index: 0 },
  { title: 'Kth Smallest Number in M Sorted Lists', normalizedTitle: 'kth-smallest-number-in-m-sorted-lists', difficulty: 'medium', patternKey: 'k-way-merge', index: 1 },
  { title: 'Kth Smallest Number in a Sorted Matrix', normalizedTitle: 'kth-smallest-number-in-a-sorted-matrix', difficulty: 'hard', patternKey: 'k-way-merge', index: 2 },
  { title: 'Smallest Number Range', normalizedTitle: 'smallest-number-range', difficulty: 'hard', patternKey: 'k-way-merge', index: 3 },
  { title: 'K Pairs with Largest Sums', normalizedTitle: 'k-pairs-with-largest-sums', difficulty: 'hard', patternKey: 'k-way-merge', index: 4 },

  // Greedy
  { title: 'Valid Palindrome II', normalizedTitle: 'valid-palindrome-ii', difficulty: 'easy', patternKey: 'greedy', index: 0 },
  { title: 'Maximum Length of Pair Chain', normalizedTitle: 'maximum-length-of-pair-chain', difficulty: 'medium', patternKey: 'greedy', index: 1 },
  { title: 'Minimum Add to Make Parentheses Valid', normalizedTitle: 'minimum-add-to-make-parentheses-valid', difficulty: 'medium', patternKey: 'greedy', index: 2 },
  { title: 'Remove Duplicate Letters', normalizedTitle: 'remove-duplicate-letters', difficulty: 'medium', patternKey: 'greedy', index: 3 },
  { title: 'Largest Palindromic Number', normalizedTitle: 'largest-palindromic-number', difficulty: 'medium', patternKey: 'greedy', index: 4 },
  { title: 'Removing Minimum and Maximum From Array', normalizedTitle: 'removing-minimum-and-maximum-from-array', difficulty: 'medium', patternKey: 'greedy', index: 5 },

  // Dynamic Programming
  { title: '0/1 Knapsack', normalizedTitle: '0-1-knapsack', difficulty: 'medium', patternKey: 'dynamic-programming', index: 0 },
  { title: 'Equal Subset Sum Partition', normalizedTitle: 'equal-subset-sum-partition', difficulty: 'medium', patternKey: 'dynamic-programming', index: 1 },
  { title: 'Subset Sum', normalizedTitle: 'subset-sum', difficulty: 'medium', patternKey: 'dynamic-programming', index: 2 },
  { title: 'Minimum Subset Sum Difference', normalizedTitle: 'minimum-subset-sum-difference', difficulty: 'hard', patternKey: 'dynamic-programming', index: 3 },
  { title: 'Count of Subset Sum', normalizedTitle: 'count-of-subset-sum', difficulty: 'hard', patternKey: 'dynamic-programming', index: 4 },
  { title: 'Target Sum', normalizedTitle: 'target-sum', difficulty: 'hard', patternKey: 'dynamic-programming', index: 5 },
  { title: 'Fibonacci numbers', normalizedTitle: 'fibonacci-numbers', difficulty: 'easy', patternKey: 'dynamic-programming', index: 6 },
  { title: 'Staircase', normalizedTitle: 'staircase', difficulty: 'easy', patternKey: 'dynamic-programming', index: 7 },
  { title: 'Number factors', normalizedTitle: 'number-factors', difficulty: 'medium', patternKey: 'dynamic-programming', index: 8 },
  { title: 'Minimum jumps to reach the end', normalizedTitle: 'minimum-jumps-to-reach-the-end', difficulty: 'medium', patternKey: 'dynamic-programming', index: 9 },
  { title: 'Minimum jumps with fee', normalizedTitle: 'minimum-jumps-with-fee', difficulty: 'medium', patternKey: 'dynamic-programming', index: 10 },
  { title: 'House thief', normalizedTitle: 'house-thief', difficulty: 'medium', patternKey: 'dynamic-programming', index: 11 },
  { title: 'Longest Palindromic Subsequence', normalizedTitle: 'longest-palindromic-subsequence', difficulty: 'medium', patternKey: 'dynamic-programming', index: 12 },
  { title: 'Longest Palindromic Substring', normalizedTitle: 'longest-palindromic-substring', difficulty: 'medium', patternKey: 'dynamic-programming', index: 13 },
  { title: 'Count of Palindromic Substrings', normalizedTitle: 'count-of-palindromic-substrings', difficulty: 'medium', patternKey: 'dynamic-programming', index: 14 },
  { title: 'Minimum Deletions in a String to make it a Palindrome', normalizedTitle: 'minimum-deletions-in-a-string-to-make-it-a-palindrome', difficulty: 'medium', patternKey: 'dynamic-programming', index: 15 },
  { title: 'Palindromic Partitioning', normalizedTitle: 'palindromic-partitioning', difficulty: 'hard', patternKey: 'dynamic-programming', index: 16 },

  // Backtracking
  { title: 'Combination Sum', normalizedTitle: 'combination-sum', difficulty: 'medium', patternKey: 'backtracking', index: 0 },
  { title: 'Word Search', normalizedTitle: 'word-search', difficulty: 'medium', patternKey: 'backtracking', index: 1 },
  { title: 'Factor Combinations', normalizedTitle: 'factor-combinations', difficulty: 'medium', patternKey: 'backtracking', index: 2 },
  { title: 'Split a String Into the Max Number of Unique Substrings', normalizedTitle: 'split-a-string-into-the-max-number-of-unique-substrings', difficulty: 'medium', patternKey: 'backtracking', index: 3 },
  { title: 'Sudoku Solver', normalizedTitle: 'sudoku-solver', difficulty: 'hard', patternKey: 'backtracking', index: 4 },

  // Trie
  { title: 'Implement Trie (Prefix Tree)', normalizedTitle: 'implement-trie-prefix-tree', difficulty: 'medium', patternKey: 'trie', index: 0 },
  { title: 'Index Pairs of a String', normalizedTitle: 'index-pairs-of-a-string', difficulty: 'easy', patternKey: 'trie', index: 1 },
  { title: 'Design Add and Search Words Data Structure', normalizedTitle: 'design-add-and-search-words-data-structure', difficulty: 'medium', patternKey: 'trie', index: 2 },
  { title: 'Extra Characters in a String', normalizedTitle: 'extra-characters-in-a-string', difficulty: 'medium', patternKey: 'trie', index: 3 },
  { title: 'Search Suggestions System', normalizedTitle: 'search-suggestions-system', difficulty: 'medium', patternKey: 'trie', index: 4 },

  // Topological Sort
  { title: 'Topological Sort', normalizedTitle: 'topological-sort', difficulty: 'medium', patternKey: 'topological-sort', index: 0 },
  { title: 'Tasks Scheduling', normalizedTitle: 'tasks-scheduling', difficulty: 'medium', patternKey: 'topological-sort', index: 1 },
  { title: 'Tasks Scheduling Order', normalizedTitle: 'tasks-scheduling-order', difficulty: 'medium', patternKey: 'topological-sort', index: 2 },
  { title: 'All Tasks Scheduling Orders', normalizedTitle: 'all-tasks-scheduling-orders', difficulty: 'hard', patternKey: 'topological-sort', index: 3 },
  { title: 'Alien Dictionary', normalizedTitle: 'alien-dictionary', difficulty: 'hard', patternKey: 'topological-sort', index: 4 },
  { title: 'Reconstructing a Sequence', normalizedTitle: 'reconstructing-a-sequence', difficulty: 'hard', patternKey: 'topological-sort', index: 5 },
  { title: 'Minimum Height Trees', normalizedTitle: 'minimum-height-trees', difficulty: 'hard', patternKey: 'topological-sort', index: 6 },

  // Union Find
  { title: 'Redundant Connection', normalizedTitle: 'redundant-connection', difficulty: 'medium', patternKey: 'union-find', index: 0 },
  { title: 'Is Graph Bipartite?', normalizedTitle: 'is-graph-bipartite', difficulty: 'medium', patternKey: 'union-find', index: 1 },
  { title: 'Path With Minimum Effort', normalizedTitle: 'path-with-minimum-effort', difficulty: 'medium', patternKey: 'union-find', index: 2 },

  // Ordered Set
  { title: 'Merge Similar Items', normalizedTitle: 'merge-similar-items', difficulty: 'easy', patternKey: 'ordered-set', index: 0 },
  { title: '132 Pattern', normalizedTitle: '132-pattern', difficulty: 'medium', patternKey: 'ordered-set', index: 1 },
  { title: 'My Calendar I', normalizedTitle: 'my-calendar-i', difficulty: 'medium', patternKey: 'ordered-set', index: 2 },
  { title: 'Longest Continuous Subarray', normalizedTitle: 'longest-continuous-subarray', difficulty: 'medium', patternKey: 'ordered-set', index: 3 },

  // Prefix Sum
  { title: 'Find the Middle Index in Array', normalizedTitle: 'find-the-middle-index-in-array', difficulty: 'easy', patternKey: 'prefix-sum', index: 0 },
  { title: 'Left and Right Sum Differences', normalizedTitle: 'left-and-right-sum-differences', difficulty: 'easy', patternKey: 'prefix-sum', index: 1 },
  { title: 'Maximum Size Subarray Sum Equals k', normalizedTitle: 'maximum-size-subarray-sum-equals-k', difficulty: 'medium', patternKey: 'prefix-sum', index: 2 },
  { title: 'Binary Subarrays With Sum', normalizedTitle: 'binary-subarrays-with-sum', difficulty: 'medium', patternKey: 'prefix-sum', index: 3 },
  { title: 'Subarray Sums Divisible by K', normalizedTitle: 'subarray-sums-divisible-by-k', difficulty: 'medium', patternKey: 'prefix-sum', index: 4 },
  { title: 'Sum of Absolute Differences in a Sorted Array', normalizedTitle: 'sum-of-absolute-differences-in-a-sorted-array', difficulty: 'medium', patternKey: 'prefix-sum', index: 5 },
  { title: 'Subarray Sum Equals K', normalizedTitle: 'subarray-sum-equals-k', difficulty: 'medium', patternKey: 'prefix-sum', index: 6 },

  // Multi-threaded
  { title: 'Same Tree', normalizedTitle: 'same-tree', difficulty: 'medium', patternKey: 'multi-threaded', index: 0 },
  { title: 'Invert Binary Tree', normalizedTitle: 'invert-binary-tree', difficulty: 'medium', patternKey: 'multi-threaded', index: 1 },
  { title: 'Binary Search Tree Iterator', normalizedTitle: 'binary-search-tree-iterator', difficulty: 'medium', patternKey: 'multi-threaded', index: 2 },

  // Bonus
  { title: 'Two Sum', normalizedTitle: 'two-sum', difficulty: 'easy', patternKey: 'bonus', index: 0 },
  { title: 'Valid Perfect Square', normalizedTitle: 'valid-perfect-square', difficulty: 'easy', patternKey: 'bonus', index: 1 },
  { title: 'Best Time to Buy and Sell Stock', normalizedTitle: 'best-time-to-buy-and-sell-stock', difficulty: 'easy', patternKey: 'bonus', index: 2 },
  { title: 'Valid Parentheses', normalizedTitle: 'valid-parentheses', difficulty: 'easy', patternKey: 'bonus', index: 3 },
  { title: 'Subtree of Another Tree', normalizedTitle: 'subtree-of-another-tree', difficulty: 'easy', patternKey: 'bonus', index: 4 },
  { title: 'Design Parking System', normalizedTitle: 'design-parking-system', difficulty: 'easy', patternKey: 'bonus', index: 5 },
  { title: 'Group Anagrams', normalizedTitle: 'group-anagrams', difficulty: 'medium', patternKey: 'bonus', index: 6 },
  { title: 'Decode String', normalizedTitle: 'decode-string', difficulty: 'medium', patternKey: 'bonus', index: 7 },
  { title: 'Valid Sudoku', normalizedTitle: 'valid-sudoku', difficulty: 'medium', patternKey: 'bonus', index: 8 },
  { title: 'Product of Array Except Self', normalizedTitle: 'product-of-array-except-self', difficulty: 'medium', patternKey: 'bonus', index: 9 },
  { title: 'Maximum Product Subarray', normalizedTitle: 'maximum-product-subarray', difficulty: 'medium', patternKey: 'bonus', index: 10 },
  { title: 'Container With Most Water', normalizedTitle: 'container-with-most-water', difficulty: 'medium', patternKey: 'bonus', index: 11 },
  { title: 'Palindromic Substrings', normalizedTitle: 'palindromic-substrings', difficulty: 'medium', patternKey: 'bonus', index: 12 },
  { title: 'Remove Nth Node From End of List', normalizedTitle: 'remove-nth-node-from-end-of-list', difficulty: 'medium', patternKey: 'bonus', index: 13 },
  { title: 'Find Minimum in Rotated Sorted Array', normalizedTitle: 'find-minimum-in-rotated-sorted-array', difficulty: 'medium', patternKey: 'bonus', index: 14 },
  { title: 'Pacific Atlantic Water Flow', normalizedTitle: 'pacific-atlantic-water-flow', difficulty: 'medium', patternKey: 'bonus', index: 15 },
  { title: 'Validate Binary Search Tree', normalizedTitle: 'validate-binary-search-tree', difficulty: 'medium', patternKey: 'bonus', index: 16 },
  { title: 'Construct Binary Tree from Preorder and Inorder Traversal', normalizedTitle: 'construct-binary-tree-from-preorder-and-inorder-traversal', difficulty: 'medium', patternKey: 'bonus', index: 17 },
  { title: 'Clone Graph', normalizedTitle: 'clone-graph', difficulty: 'medium', patternKey: 'bonus', index: 18 },
  { title: 'House Robber II', normalizedTitle: 'house-robber-ii', difficulty: 'medium', patternKey: 'bonus', index: 19 },
  { title: 'Decode Ways', normalizedTitle: 'decode-ways', difficulty: 'medium', patternKey: 'bonus', index: 20 },
  { title: 'Unique Paths', normalizedTitle: 'unique-paths', difficulty: 'medium', patternKey: 'bonus', index: 21 },
  { title: 'Word Break', normalizedTitle: 'word-break', difficulty: 'medium', patternKey: 'bonus', index: 22 },
  { title: 'Lowest Common Ancestor of a Binary Search Tree', normalizedTitle: 'lowest-common-ancestor-of-a-binary-search-tree', difficulty: 'medium', patternKey: 'bonus', index: 23 },
  { title: 'Longest Consecutive Sequence', normalizedTitle: 'longest-consecutive-sequence', difficulty: 'medium', patternKey: 'bonus', index: 24 },
  { title: 'Meeting Rooms II', normalizedTitle: 'meeting-rooms-ii', difficulty: 'medium', patternKey: 'bonus', index: 25 },
  { title: 'Encode and Decode Strings', normalizedTitle: 'encode-and-decode-strings', difficulty: 'medium', patternKey: 'bonus', index: 26 },
  { title: 'Number of Connected Components in an Undirected Graph', normalizedTitle: 'number-of-connected-components-in-an-undirected-graph', difficulty: 'medium', patternKey: 'bonus', index: 27 },
  { title: 'Graph Valid Tree', normalizedTitle: 'graph-valid-tree', difficulty: 'medium', patternKey: 'bonus', index: 28 },
  { title: 'Longest Valid Parentheses', normalizedTitle: 'longest-valid-parentheses', difficulty: 'hard', patternKey: 'bonus', index: 29 },
  { title: 'Serialize and Deserialize Binary Tree', normalizedTitle: 'serialize-and-deserialize-binary-tree', difficulty: 'hard', patternKey: 'bonus', index: 30 },
];

// Build lookup map for fast matching
const curriculumByNormalizedTitle = new Map<string, CurriculumProblem>();
for (const problem of GTCI_CURRICULUM) {
  curriculumByNormalizedTitle.set(problem.normalizedTitle, problem);
}

// Normalize a problem title for matching
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

// Match a title to curriculum
export function matchCurriculum(normalizedTitle: string): CurriculumInfo | undefined {
  const match = curriculumByNormalizedTitle.get(normalizedTitle);
  if (match) {
    return {
      track: 'gtci',
      patternKey: match.patternKey,
      index: match.index,
      normalizedTitle: match.normalizedTitle,
    };
  }

  // Try fuzzy matching for LeetCode titles that might differ slightly
  for (const [key, problem] of curriculumByNormalizedTitle) {
    if (normalizedTitle.includes(key) || key.includes(normalizedTitle)) {
      return {
        track: 'gtci',
        patternKey: problem.patternKey,
        index: problem.index,
        normalizedTitle: problem.normalizedTitle,
      };
    }
  }

  return undefined;
}

// Get all patterns
export function getPatterns(): string[] {
  const patterns = new Set<string>();
  for (const problem of GTCI_CURRICULUM) {
    patterns.add(problem.patternKey);
  }
  return Array.from(patterns);
}

// Get problems by pattern
export function getProblemsByPattern(patternKey: string): CurriculumProblem[] {
  return GTCI_CURRICULUM.filter(p => p.patternKey === patternKey);
}
