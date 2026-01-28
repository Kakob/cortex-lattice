from typing import List
from collections import deque

def find_attention_paths(
    attention: List[List[float]], 
    start: int, 
    end: int,
    threshold: float
) -> List[List[int]]:
    """
    Find all paths from start to end with combined weight >= threshold.
    
    Uses BFS with path tracking. Prunes paths that fall below threshold.
    
    Time: O(V * 2^E) worst case (exponential in edges)
    Space: O(V * paths) for storing all valid paths
    """
    n = len(attention)
    valid_paths = []
    
    # BFS with path and weight tracking
    # Each element: (current_node, path, cumulative_weight)
    queue = deque([(start, [start], 1.0)])
    
    while queue:
        node, path, weight = queue.popleft()
        
        # Check if we reached destination
        if node == end:
            if weight >= threshold:
                valid_paths.append(path)
            continue
        
        # Explore neighbors
        for next_node in range(n):
            edge_weight = attention[node][next_node]
            
            # Skip if no edge or would create cycle
            if edge_weight == 0 or next_node in path:
                continue
            
            new_weight = weight * edge_weight
            
            # Prune if below threshold (can't improve)
            if new_weight >= threshold * 0.1:  # Allow some slack for multi-hop
                queue.append((next_node, path + [next_node], new_weight))
    
    return valid_paths


def find_strongest_path(attention: List[List[float]], start: int, end: int) -> tuple:
    """
    Find the single strongest path using modified Dijkstra.
    
    Instead of minimizing sum, we maximize product of weights.
    Trick: maximize product = maximize sum of logs
    """
    import math
    n = len(attention)
    
    # Use negative log for "distance" (minimizing negative log = maximizing product)
    INF = float('inf')
    dist = [INF] * n
    parent = [-1] * n
    dist[start] = 0
    
    # Priority queue: (negative_log_weight, node)
    import heapq
    pq = [(0, start)]
    
    while pq:
        d, node = heapq.heappop(pq)
        
        if d > dist[node]:
            continue
        
        for next_node in range(n):
            w = attention[node][next_node]
            if w > 0:
                # Distance = negative log weight
                new_dist = dist[node] - math.log(w)
                if new_dist < dist[next_node]:
                    dist[next_node] = new_dist
                    parent[next_node] = node
                    heapq.heappush(pq, (new_dist, next_node))
    
    # Reconstruct path
    if dist[end] == INF:
        return [], 0.0
    
    path = []
    node = end
    while node != -1:
        path.append(node)
        node = parent[node]
    path.reverse()
    
    # Compute actual weight
    weight = 1.0
    for i in range(len(path) - 1):
        weight *= attention[path[i]][path[i+1]]
    
    return path, weight


if __name__ == "__main__":
    attention = [[0, 0.9, 0.1], [0, 0, 0.8], [0, 0, 0]]
    
    paths = find_attention_paths(attention, 0, 2, 0.5)
    print(f"Valid paths: {paths}")
    
    best_path, weight = find_strongest_path(attention, 0, 2)
    print(f"Strongest path: {best_path} with weight {weight:.4f}")
