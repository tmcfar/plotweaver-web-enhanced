"""Bounded collections to prevent memory leaks."""
from collections import OrderedDict, deque
from typing import Generic, TypeVar, Optional, Iterator, Dict, Set
import time

K = TypeVar('K')
V = TypeVar('V')


class LRUCache(Generic[K, V]):
    """LRU (Least Recently Used) cache with maximum size."""
    
    def __init__(self, max_size: int):
        self.max_size = max_size
        self.cache: OrderedDict[K, V] = OrderedDict()
    
    def get(self, key: K) -> Optional[V]:
        """Get value and mark as recently used."""
        if key in self.cache:
            # Move to end (most recently used)
            value = self.cache.pop(key)
            self.cache[key] = value
            return value
        return None
    
    def put(self, key: K, value: V) -> None:
        """Put value and evict oldest if necessary."""
        if key in self.cache:
            # Update existing
            self.cache.pop(key)
        elif len(self.cache) >= self.max_size:
            # Evict oldest
            self.cache.popitem(last=False)
        
        self.cache[key] = value
    
    def remove(self, key: K) -> Optional[V]:
        """Remove and return value."""
        return self.cache.pop(key, None)
    
    def clear(self) -> None:
        """Clear all items."""
        self.cache.clear()
    
    def __len__(self) -> int:
        return len(self.cache)
    
    def __contains__(self, key: K) -> bool:
        return key in self.cache
    
    def keys(self) -> Iterator[K]:
        return iter(self.cache.keys())
    
    def values(self) -> Iterator[V]:
        return iter(self.cache.values())
    
    def items(self) -> Iterator[tuple[K, V]]:
        return iter(self.cache.items())


class BoundedDict(Generic[K, V]):
    """Dictionary with maximum size and automatic cleanup."""
    
    def __init__(self, max_size: int, ttl_seconds: Optional[int] = None):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self._data: Dict[K, V] = {}
        self._timestamps: Dict[K, float] = {} if ttl_seconds else {}
        self._access_order: deque[K] = deque()
    
    def __setitem__(self, key: K, value: V) -> None:
        current_time = time.time()
        
        # Remove existing key if present
        if key in self._data:
            self._access_order.remove(key)
        
        # Check if we need to evict
        while len(self._data) >= self.max_size:
            self._evict_oldest()
        
        # Add new item
        self._data[key] = value
        self._access_order.append(key)
        
        if self.ttl_seconds:
            self._timestamps[key] = current_time
    
    def __getitem__(self, key: K) -> V:
        self._cleanup_expired()
        if key not in self._data:
            raise KeyError(key)
        
        # Update access order
        self._access_order.remove(key)
        self._access_order.append(key)
        
        return self._data[key]
    
    def __delitem__(self, key: K) -> None:
        if key in self._data:
            del self._data[key]
            self._access_order.remove(key)
            if self.ttl_seconds:
                self._timestamps.pop(key, None)
    
    def __contains__(self, key: K) -> bool:
        self._cleanup_expired()
        return key in self._data
    
    def __len__(self) -> int:
        self._cleanup_expired()
        return len(self._data)
    
    def get(self, key: K, default: Optional[V] = None) -> Optional[V]:
        """Get value with default."""
        try:
            return self[key]
        except KeyError:
            return default
    
    def pop(self, key: K, default: Optional[V] = None) -> Optional[V]:
        """Remove and return value."""
        if key in self._data:
            value = self._data[key]
            del self[key]
            return value
        return default
    
    def keys(self):
        """Get all keys."""
        self._cleanup_expired()
        return self._data.keys()
    
    def values(self):
        """Get all values."""
        self._cleanup_expired()
        return self._data.values()
    
    def items(self):
        """Get all items."""
        self._cleanup_expired()
        return self._data.items()
    
    def clear(self) -> None:
        """Clear all items."""
        self._data.clear()
        self._access_order.clear()
        if self.ttl_seconds:
            self._timestamps.clear()
    
    def _evict_oldest(self) -> None:
        """Evict the oldest (least recently used) item."""
        if self._access_order:
            oldest_key = self._access_order.popleft()
            self._data.pop(oldest_key, None)
            if self.ttl_seconds:
                self._timestamps.pop(oldest_key, None)
    
    def _cleanup_expired(self) -> None:
        """Remove expired items."""
        if not self.ttl_seconds:
            return
        
        current_time = time.time()
        expired_keys = []
        
        for key, timestamp in self._timestamps.items():
            if current_time - timestamp > self.ttl_seconds:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self[key]


class BoundedSet(Generic[K]):
    """Set with maximum size and automatic cleanup."""
    
    def __init__(self, max_size: int):
        self.max_size = max_size
        self._data: Set[K] = set()
        self._access_order: deque[K] = deque()
    
    def add(self, item: K) -> None:
        """Add item to set."""
        if item in self._data:
            # Update access order
            self._access_order.remove(item)
            self._access_order.append(item)
            return
        
        # Check if we need to evict
        while len(self._data) >= self.max_size:
            self._evict_oldest()
        
        # Add new item
        self._data.add(item)
        self._access_order.append(item)
    
    def remove(self, item: K) -> None:
        """Remove item from set."""
        if item in self._data:
            self._data.remove(item)
            self._access_order.remove(item)
    
    def discard(self, item: K) -> None:
        """Remove item if present."""
        if item in self._data:
            self.remove(item)
    
    def __contains__(self, item: K) -> bool:
        return item in self._data
    
    def __len__(self) -> int:
        return len(self._data)
    
    def __iter__(self):
        return iter(self._data)
    
    def clear(self) -> None:
        """Clear all items."""
        self._data.clear()
        self._access_order.clear()
    
    def _evict_oldest(self) -> None:
        """Evict the oldest item."""
        if self._access_order:
            oldest_item = self._access_order.popleft()
            self._data.discard(oldest_item)