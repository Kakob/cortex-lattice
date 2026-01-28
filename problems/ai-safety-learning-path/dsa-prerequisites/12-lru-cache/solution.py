from collections import OrderedDict

class LRUCache:
    """
    LRU Cache using OrderedDict.
    
    Key insight: OrderedDict maintains insertion order AND allows
    moving items to end in O(1) with move_to_end().
    
    Time: O(1) for get and put
    Space: O(capacity)
    """
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()
    
    def get(self, key: int):
        if key not in self.cache:
            return None
        
        # Move to end (most recently used)
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key: int, value):
        if key in self.cache:
            # Update existing and move to end
            self.cache.move_to_end(key)
            self.cache[key] = value
        else:
            # Add new entry
            if len(self.cache) >= self.capacity:
                # Evict least recently used (first item)
                self.cache.popitem(last=False)
            self.cache[key] = value


class LRUCacheManual:
    """
    Manual implementation with doubly linked list + hashmap.
    
    This is what you'd implement in an interview!
    """
    
    class Node:
        def __init__(self, key=0, val=0):
            self.key = key
            self.val = val
            self.prev = None
            self.next = None
    
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> Node
        
        # Dummy head and tail
        self.head = self.Node()
        self.tail = self.Node()
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def _remove(self, node):
        """Remove node from linked list."""
        node.prev.next = node.next
        node.next.prev = node.prev
    
    def _add_to_end(self, node):
        """Add node just before tail (most recent)."""
        node.prev = self.tail.prev
        node.next = self.tail
        self.tail.prev.next = node
        self.tail.prev = node
    
    def get(self, key: int):
        if key not in self.cache:
            return None
        
        node = self.cache[key]
        self._remove(node)
        self._add_to_end(node)
        return node.val
    
    def put(self, key: int, value):
        if key in self.cache:
            node = self.cache[key]
            node.val = value
            self._remove(node)
            self._add_to_end(node)
        else:
            if len(self.cache) >= self.capacity:
                # Evict LRU (just after head)
                lru = self.head.next
                self._remove(lru)
                del self.cache[lru.key]
            
            node = self.Node(key, value)
            self.cache[key] = node
            self._add_to_end(node)


if __name__ == "__main__":
    cache = LRUCache(2)
    
    cache.put(1, "K1,V1")
    cache.put(2, "K2,V2")
    print(cache.get(1))  # Returns "K1,V1"
    
    cache.put(3, "K3,V3")  # Evicts key 2
    print(cache.get(2))  # Returns None (evicted!)
    
    cache.put(4, "K4,V4")  # Evicts key 1
    print(cache.get(1))  # Returns None
    print(cache.get(3))  # Returns "K3,V3"
    print(cache.get(4))  # Returns "K4,V4"
