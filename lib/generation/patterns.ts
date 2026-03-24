/**
 * Pattern metadata for AI problem generation.
 * Provides context about each algorithmic pattern to guide prompt construction.
 */

export interface PatternInfo {
  key: string;
  name: string;
  description: string;
  whenToUse: string;
  template: string;
  keyConcepts: string[];
}

export const PATTERNS: Record<string, PatternInfo> = {
  "two-pointers": {
    key: "two-pointers",
    name: "Two Pointers",
    description:
      "Use two pointers to traverse a sorted array or linked list, making decisions based on comparisons to avoid brute-force nested loops.",
    whenToUse:
      "Sorted array, find pairs/triplets, move from both ends or same direction, optimize from O(n²) to O(n)",
    template: `left, right = 0, len(arr) - 1
while left < right:
    current = arr[left] + arr[right]  # or difference, etc.
    if current == target:
        # found
    elif current < target:
        left += 1
    else:
        right -= 1`,
    keyConcepts: [
      "Sorted input enables greedy pointer movement",
      "Each pointer moves in only one direction (monotonic)",
      "Comparison with target determines which pointer moves",
      "Achieves O(n) by eliminating impossible pairs without checking them",
    ],
  },

  "fast-slow-pointers": {
    key: "fast-slow-pointers",
    name: "Fast & Slow Pointers",
    description:
      "Use two pointers moving at different speeds to detect cycles, find midpoints, or identify patterns in linked lists and sequences.",
    whenToUse:
      "Cycle detection, finding middle element, palindrome check in linked list",
    template: `slow = head
fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
    if slow == fast:
        # cycle detected`,
    keyConcepts: [
      "Fast pointer moves 2x speed of slow pointer",
      "They meet inside a cycle (if one exists)",
      "When fast reaches end, slow is at midpoint",
      "Floyd's cycle detection algorithm",
    ],
  },

  "sliding-window": {
    key: "sliding-window",
    name: "Sliding Window",
    description:
      "Maintain a window of elements that slides across an array or string, expanding and shrinking to find optimal subarrays/substrings.",
    whenToUse:
      "Contiguous subarray/substring problems, max/min sum of size k, longest substring with constraint",
    template: `window_start = 0
for window_end in range(len(arr)):
    # expand window by including arr[window_end]
    while condition_violated:
        # shrink window from left
        window_start += 1
    # update result`,
    keyConcepts: [
      "Window defined by start and end indices",
      "Expand by moving end pointer right",
      "Shrink by moving start pointer right when constraint violated",
      "Maintains running state (sum, count, frequency map) to avoid recomputation",
    ],
  },

  "merge-intervals": {
    key: "merge-intervals",
    name: "Merge Intervals",
    description:
      "Sort intervals by start time, then merge overlapping ones or find intersections by comparing end times.",
    whenToUse:
      "Overlapping intervals, scheduling conflicts, merging time ranges, finding free time",
    template: `intervals.sort(key=lambda x: x[0])
merged = [intervals[0]]
for current in intervals[1:]:
    if current[0] <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], current[1])
    else:
        merged.append(current)`,
    keyConcepts: [
      "Sort by start time first",
      "Compare current start with previous end to detect overlap",
      "Merge by extending the end time",
      "Non-overlapping intervals are added as-is",
    ],
  },

  "cyclic-sort": {
    key: "cyclic-sort",
    name: "Cyclic Sort",
    description:
      "Place each number at its correct index in O(n) time. Works when array contains numbers in a known range (1 to n or 0 to n).",
    whenToUse:
      "Array contains numbers in range [1, n] or [0, n], find missing/duplicate numbers",
    template: `i = 0
while i < len(nums):
    correct = nums[i] - 1  # where this number should be
    if nums[i] != nums[correct]:
        nums[i], nums[correct] = nums[correct], nums[i]
    else:
        i += 1`,
    keyConcepts: [
      "Each number has exactly one correct position",
      "Swap until current position has correct number",
      "O(n) because each number is swapped at most once to its correct position",
      "After sorting, missing/duplicate numbers are at wrong positions",
    ],
  },

  "linked-list-reversal": {
    key: "linked-list-reversal",
    name: "In-place Linked List Reversal",
    description:
      "Reverse a linked list or a portion of it in-place by manipulating node pointers.",
    whenToUse:
      "Reverse entire list, reverse sub-list between positions, reverse in groups of k",
    template: `prev = None
current = head
while current:
    next_node = current.next
    current.next = prev
    prev = current
    current = next_node
return prev`,
    keyConcepts: [
      "Track three pointers: previous, current, next",
      "Save next before overwriting current.next",
      "Each iteration reverses one link",
      "prev becomes the new head after full reversal",
    ],
  },

  "binary-search": {
    key: "binary-search",
    name: "Binary Search",
    description:
      "Halve the search space each iteration by comparing with a middle element. Works on sorted data or monotonic functions.",
    whenToUse:
      "Sorted array search, find boundary/insertion point, search on answer space",
    template: `left, right = 0, len(arr) - 1
while left <= right:
    mid = left + (right - left) // 2
    if arr[mid] == target:
        return mid
    elif arr[mid] < target:
        left = mid + 1
    else:
        right = mid - 1`,
    keyConcepts: [
      "Halves search space each iteration → O(log n)",
      "Use left + (right - left) // 2 to avoid overflow",
      "Variations: find leftmost, rightmost, or closest",
      "Can apply to non-array problems (search on answer space)",
    ],
  },

  "tree-bfs": {
    key: "tree-bfs",
    name: "Tree BFS (Level Order Traversal)",
    description:
      "Traverse a tree level by level using a queue. Process all nodes at current depth before moving to the next.",
    whenToUse:
      "Level-order traversal, minimum depth, connect level siblings, zigzag traversal",
    template: `from collections import deque
queue = deque([root])
while queue:
    level_size = len(queue)
    for _ in range(level_size):
        node = queue.popleft()
        # process node
        if node.left: queue.append(node.left)
        if node.right: queue.append(node.right)`,
    keyConcepts: [
      "Queue ensures FIFO order → level-by-level processing",
      "Track level_size to process one level at a time",
      "Each node is visited exactly once → O(n)",
      "Space is O(w) where w is maximum width of tree",
    ],
  },

  "tree-dfs": {
    key: "tree-dfs",
    name: "Tree DFS (Depth First Search)",
    description:
      "Explore tree paths from root to leaves using recursion or a stack. Variants: preorder, inorder, postorder.",
    whenToUse:
      "Path sum problems, tree diameter, check if path exists, serialize/deserialize tree",
    template: `def dfs(node, path_sum):
    if not node:
        return False
    path_sum += node.val
    if not node.left and not node.right:  # leaf
        return path_sum == target
    return dfs(node.left, path_sum) or dfs(node.right, path_sum)`,
    keyConcepts: [
      "Recursion naturally follows tree structure",
      "Base case: null node or leaf node",
      "Pass accumulated state (sum, path, depth) through parameters",
      "Backtracking: state is restored when recursion returns",
    ],
  },

  "two-heaps": {
    key: "two-heaps",
    name: "Two Heaps",
    description:
      "Use a max-heap and min-heap together to efficiently find medians or balance two halves of a dataset.",
    whenToUse:
      "Find median from data stream, sliding window median, schedule optimization",
    template: `import heapq
max_heap = []  # negate values for max behavior
min_heap = []

def add_num(num):
    heapq.heappush(max_heap, -num)
    heapq.heappush(min_heap, -heapq.heappop(max_heap))
    if len(min_heap) > len(max_heap):
        heapq.heappush(max_heap, -heapq.heappop(min_heap))

def find_median():
    if len(max_heap) > len(min_heap):
        return -max_heap[0]
    return (-max_heap[0] + min_heap[0]) / 2`,
    keyConcepts: [
      "Max-heap holds smaller half, min-heap holds larger half",
      "Balance: max-heap can have at most 1 more element",
      "Median is always at the top of one or both heaps",
      "Python heapq is min-heap; negate values for max-heap behavior",
    ],
  },

  subsets: {
    key: "subsets",
    name: "Subsets / Combinations",
    description:
      "Generate all subsets, permutations, or combinations using BFS-style iterative building or DFS backtracking.",
    whenToUse:
      "Generate all subsets, permutations, combinations, string permutations with duplicates",
    template: `def subsets(nums):
    result = [[]]
    for num in nums:
        result += [subset + [num] for subset in result]
    return result`,
    keyConcepts: [
      "BFS approach: build new subsets by adding current element to all existing subsets",
      "DFS/backtracking approach: include or exclude each element recursively",
      "For duplicates: sort first, skip consecutive duplicates",
      "Total subsets: 2^n, total permutations: n!",
    ],
  },

  "top-k-elements": {
    key: "top-k-elements",
    name: "Top K Elements",
    description:
      "Use a heap to efficiently find the K largest, smallest, or most frequent elements without full sorting.",
    whenToUse:
      "K largest/smallest elements, K most frequent, K closest points, sort by frequency",
    template: `import heapq
# For K largest: use min-heap of size K
result = heapq.nlargest(k, nums)
# Or manually:
heap = []
for num in nums:
    heapq.heappush(heap, num)
    if len(heap) > k:
        heapq.heappop(heap)`,
    keyConcepts: [
      "Min-heap of size K for K largest (pop smallest when heap exceeds K)",
      "Max-heap of size K for K smallest (negate values)",
      "O(n log k) vs O(n log n) for full sort",
      "Heap top always has the Kth element",
    ],
  },

  "k-way-merge": {
    key: "k-way-merge",
    name: "K-Way Merge",
    description:
      "Merge K sorted lists/arrays using a min-heap to always pick the smallest available element.",
    whenToUse:
      "Merge K sorted lists, find Kth smallest in sorted matrix, smallest range covering elements from K lists",
    template: `import heapq
heap = []
for i, lst in enumerate(lists):
    if lst:
        heapq.heappush(heap, (lst[0], i, 0))
result = []
while heap:
    val, list_idx, elem_idx = heapq.heappop(heap)
    result.append(val)
    if elem_idx + 1 < len(lists[list_idx]):
        heapq.heappush(heap, (lists[list_idx][elem_idx + 1], list_idx, elem_idx + 1))`,
    keyConcepts: [
      "Heap contains one element from each list (the current smallest)",
      "Always pop the global minimum, then push the next from that list",
      "Heap size is at most K → each operation is O(log K)",
      "Total time: O(N log K) where N is total elements across all lists",
    ],
  },

  "topological-sort": {
    key: "topological-sort",
    name: "Topological Sort",
    description:
      "Order vertices of a directed acyclic graph (DAG) so that every edge goes from earlier to later in the ordering.",
    whenToUse:
      "Task scheduling with dependencies, course prerequisites, build order, cycle detection in directed graph",
    template: `from collections import deque
in_degree = {node: 0 for node in graph}
for node in graph:
    for neighbor in graph[node]:
        in_degree[neighbor] += 1
queue = deque([n for n in in_degree if in_degree[n] == 0])
order = []
while queue:
    node = queue.popleft()
    order.append(node)
    for neighbor in graph[node]:
        in_degree[neighbor] -= 1
        if in_degree[neighbor] == 0:
            queue.append(neighbor)`,
    keyConcepts: [
      "Start with nodes that have no incoming edges (in-degree 0)",
      "Process node, reduce in-degree of neighbors",
      "When neighbor reaches in-degree 0, add to queue",
      "If result length < node count, graph has a cycle",
    ],
  },

  "dynamic-programming": {
    key: "dynamic-programming",
    name: "Dynamic Programming",
    description:
      "Break problem into overlapping subproblems, solve each once, and store results. Build solution bottom-up or top-down with memoization.",
    whenToUse:
      "Optimization problems (min/max), counting problems, decision problems with overlapping subproblems and optimal substructure",
    template: `# Bottom-up
dp = [0] * (n + 1)
dp[0] = base_case
for i in range(1, n + 1):
    dp[i] = best of dp[j] for valid j < i
return dp[n]`,
    keyConcepts: [
      "Identify subproblems and their relationships (recurrence)",
      "Bottom-up: fill table from base cases to target",
      "Top-down: recursion + memoization (cache results)",
      "Common patterns: 0/1 knapsack, unbounded knapsack, Fibonacci-style, grid traversal",
    ],
  },
};

/**
 * Get theme display names and descriptions for prompt context.
 */
export const THEME_INFO: Record<
  string,
  { displayName: string; flavor: string }
> = {
  "wizard-dungeon": {
    displayName: "Wizard's Dungeon",
    flavor:
      "Fantasy RPG setting. Problems involve spells, runes, magical artifacts, dungeon rooms, monster stats, potion ingredients, enchantments, and quest objectives. Use fantasy vocabulary and imagery.",
  },
  "software-engineering": {
    displayName: "Software Engineering",
    flavor:
      "Tech industry setting. Problems involve servers, APIs, deployment pipelines, databases, network packets, microservices, log analysis, and system design. Use technical vocabulary.",
  },
  finance: {
    displayName: "Finance & Trading",
    flavor:
      "Financial markets setting. Problems involve stock prices, portfolios, trading strategies, risk analysis, transaction records, market data, interest rates, and asset allocation. Use financial vocabulary.",
  },
  medicine: {
    displayName: "Clinical Medicine",
    flavor:
      "Healthcare setting. Problems involve patient records, lab results, drug dosages, diagnostic data, vital signs, treatment schedules, clinical trials, and medical imaging metrics. Use medical vocabulary.",
  },
};
