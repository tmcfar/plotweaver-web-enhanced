import { EventEmitter } from 'events'

export interface DocumentChange {
  id: string
  userId: string
  timestamp: Date
  type: 'insert' | 'delete' | 'replace'
  position: {
    start: number
    end: number
  }
  content: string
  originalContent?: string
  metadata?: Record<string, any>
}

export interface ConflictInfo {
  id: string
  type: 'concurrent_edit' | 'lock_violation' | 'version_mismatch'
  changes: DocumentChange[]
  affectedRange: {
    start: number
    end: number
  }
  severity: 'low' | 'medium' | 'high'
  autoResolvable: boolean
  timestamp: Date
}

export interface ResolutionStrategy {
  type: 'accept_local' | 'accept_remote' | 'merge' | 'manual'
  description: string
  result?: string
}

export interface OperationalTransform {
  original: DocumentChange
  transformed: DocumentChange
  reason: string
}

export class ConflictResolver extends EventEmitter {
  private pendingChanges: Map<string, DocumentChange> = new Map()
  private conflicts: Map<string, ConflictInfo> = new Map()
  private documentVersion: number = 0
  private isLocked: boolean = false
  private lockOwner?: string

  constructor() {
    super()
  }

  // Apply operational transformation to resolve conflicts
  applyChange(change: DocumentChange): { 
    success: boolean
    transformedChange?: DocumentChange
    conflicts?: ConflictInfo[]
  } {
    try {
      // Check for conflicts
      const conflicts = this.detectConflicts(change)
      
      if (conflicts.length > 0) {
        // Store conflicts for resolution
        conflicts.forEach(conflict => {
          this.conflicts.set(conflict.id, conflict)
        })

        this.emit('conflicts_detected', conflicts)
        
        // Try to auto-resolve if possible
        const autoResolved = this.attemptAutoResolution(conflicts)
        
        if (autoResolved.length > 0) {
          this.emit('conflicts_auto_resolved', autoResolved)
        }

        return {
          success: false,
          conflicts: conflicts.filter(c => !autoResolved.includes(c))
        }
      }

      // Transform the change if needed
      const transformedChange = this.transformChange(change)
      
      // Apply the change
      this.pendingChanges.set(change.id, transformedChange)
      this.documentVersion++
      
      this.emit('change_applied', transformedChange)
      
      return {
        success: true,
        transformedChange
      }
    } catch (error) {
      this.emit('resolution_error', { change, error })
      return { success: false }
    }
  }

  // Detect conflicts between changes
  private detectConflicts(newChange: DocumentChange): ConflictInfo[] {
    const conflicts: ConflictInfo[] = []
    
    // Check for concurrent edits
    for (const [id, pendingChange] of this.pendingChanges) {
      if (this.changesOverlap(newChange, pendingChange)) {
        const conflict: ConflictInfo = {
          id: `conflict_${Date.now()}_${Math.random()}`,
          type: 'concurrent_edit',
          changes: [pendingChange, newChange],
          affectedRange: this.getOverlapRange(pendingChange, newChange),
          severity: this.calculateSeverity(pendingChange, newChange),
          autoResolvable: this.isAutoResolvable(pendingChange, newChange),
          timestamp: new Date()
        }
        conflicts.push(conflict)
      }
    }

    // Check for lock violations
    if (this.isLocked && this.lockOwner !== newChange.userId) {
      const conflict: ConflictInfo = {
        id: `lock_violation_${Date.now()}`,
        type: 'lock_violation',
        changes: [newChange],
        affectedRange: newChange.position,
        severity: 'high',
        autoResolvable: false,
        timestamp: new Date()
      }
      conflicts.push(conflict)
    }

    return conflicts
  }

  // Transform a change using operational transformation
  private transformChange(change: DocumentChange): DocumentChange {
    let transformedChange = { ...change }
    
    // Apply transformations based on pending changes
    for (const [id, pendingChange] of this.pendingChanges) {
      if (pendingChange.timestamp < change.timestamp) {
        transformedChange = this.operationalTransform(transformedChange, pendingChange)
      }
    }
    
    return transformedChange
  }

  // Operational transformation algorithm
  private operationalTransform(change: DocumentChange, againstChange: DocumentChange): DocumentChange {
    const transformed = { ...change }
    
    // Transform position based on the other change
    if (againstChange.position.start <= change.position.start) {
      const offset = this.calculateOffset(againstChange)
      transformed.position = {
        start: Math.max(0, change.position.start + offset),
        end: Math.max(0, change.position.end + offset)
      }
    }
    
    return transformed
  }

  private calculateOffset(change: DocumentChange): number {
    switch (change.type) {
      case 'insert':
        return change.content.length
      case 'delete':
        return -(change.position.end - change.position.start)
      case 'replace':
        const deletedLength = change.position.end - change.position.start
        return change.content.length - deletedLength
      default:
        return 0
    }
  }

  // Check if two changes overlap
  private changesOverlap(change1: DocumentChange, change2: DocumentChange): boolean {
    const { start: start1, end: end1 } = change1.position
    const { start: start2, end: end2 } = change2.position
    
    return !(end1 <= start2 || end2 <= start1)
  }

  // Get the overlapping range between two changes
  private getOverlapRange(change1: DocumentChange, change2: DocumentChange): {
    start: number
    end: number
  } {
    const { start: start1, end: end1 } = change1.position
    const { start: start2, end: end2 } = change2.position
    
    return {
      start: Math.max(start1, start2),
      end: Math.min(end1, end2)
    }
  }

  // Calculate conflict severity
  private calculateSeverity(change1: DocumentChange, change2: DocumentChange): 'low' | 'medium' | 'high' {
    const overlap = this.getOverlapRange(change1, change2)
    const overlapSize = overlap.end - overlap.start
    
    // Different users editing the same content
    if (change1.userId !== change2.userId && overlapSize > 0) {
      return 'high'
    }
    
    // Adjacent changes
    if (overlapSize === 0) {
      return 'low'
    }
    
    return 'medium'
  }

  // Check if conflict can be auto-resolved
  private isAutoResolvable(change1: DocumentChange, change2: DocumentChange): boolean {
    // Same user - can usually auto-resolve
    if (change1.userId === change2.userId) {
      return true
    }
    
    // Non-overlapping adjacent changes
    const overlap = this.getOverlapRange(change1, change2)
    if (overlap.end - overlap.start === 0) {
      return true
    }
    
    // One is insert, other is non-conflicting
    if (change1.type === 'insert' && change2.type === 'insert') {
      return change1.position.start !== change2.position.start
    }
    
    return false
  }

  // Attempt to automatically resolve conflicts
  private attemptAutoResolution(conflicts: ConflictInfo[]): ConflictInfo[] {
    const resolved: ConflictInfo[] = []
    
    for (const conflict of conflicts) {
      if (conflict.autoResolvable) {
        const resolution = this.autoResolveConflict(conflict)
        if (resolution) {
          resolved.push(conflict)
          this.conflicts.delete(conflict.id)
        }
      }
    }
    
    return resolved
  }

  // Auto-resolve a specific conflict
  private autoResolveConflict(conflict: ConflictInfo): boolean {
    try {
      switch (conflict.type) {
        case 'concurrent_edit':
          return this.resolveConcurrentEdit(conflict)
        default:
          return false
      }
    } catch (error) {
      this.emit('auto_resolution_failed', { conflict, error })
      return false
    }
  }

  // Resolve concurrent edit conflicts
  private resolveConcurrentEdit(conflict: ConflictInfo): boolean {
    const [change1, change2] = conflict.changes
    
    // Same user - merge changes
    if (change1.userId === change2.userId) {
      const merged = this.mergeChanges(change1, change2)
      this.pendingChanges.set(merged.id, merged)
      this.pendingChanges.delete(change1.id)
      return true
    }
    
    // Adjacent inserts - apply both
    if (change1.type === 'insert' && change2.type === 'insert') {
      const earlier = change1.timestamp < change2.timestamp ? change1 : change2
      const later = change1.timestamp < change2.timestamp ? change2 : change1
      
      // Transform the later change
      const transformed = this.operationalTransform(later, earlier)
      this.pendingChanges.set(transformed.id, transformed)
      
      return true
    }
    
    return false
  }

  // Merge two changes from the same user
  private mergeChanges(change1: DocumentChange, change2: DocumentChange): DocumentChange {
    const earlier = change1.timestamp < change2.timestamp ? change1 : change2
    const later = change1.timestamp < change2.timestamp ? change2 : change1
    
    return {
      id: `merged_${earlier.id}_${later.id}`,
      userId: earlier.userId,
      timestamp: later.timestamp,
      type: 'replace',
      position: {
        start: Math.min(earlier.position.start, later.position.start),
        end: Math.max(earlier.position.end, later.position.end)
      },
      content: later.content,
      originalContent: earlier.originalContent,
      metadata: {
        ...earlier.metadata,
        ...later.metadata,
        merged: true,
        originalChanges: [earlier.id, later.id]
      }
    }
  }

  // Manual conflict resolution
  resolveConflict(conflictId: string, strategy: ResolutionStrategy): boolean {
    const conflict = this.conflicts.get(conflictId)
    if (!conflict) return false
    
    try {
      const resolved = this.applyResolutionStrategy(conflict, strategy)
      if (resolved) {
        this.conflicts.delete(conflictId)
        this.emit('conflict_resolved', { conflict, strategy })
        return true
      }
    } catch (error) {
      this.emit('resolution_error', { conflict, strategy, error })
    }
    
    return false
  }

  private applyResolutionStrategy(conflict: ConflictInfo, strategy: ResolutionStrategy): boolean {
    switch (strategy.type) {
      case 'accept_local':
        // Keep the first change, discard others
        const localChange = conflict.changes[0]
        this.pendingChanges.set(localChange.id, localChange)
        return true
        
      case 'accept_remote':
        // Keep the last change, discard others
        const remoteChange = conflict.changes[conflict.changes.length - 1]
        this.pendingChanges.set(remoteChange.id, remoteChange)
        return true
        
      case 'merge':
        // Create a merged change
        if (strategy.result) {
          const mergedChange: DocumentChange = {
            id: `resolved_${conflict.id}`,
            userId: conflict.changes[0].userId,
            timestamp: new Date(),
            type: 'replace',
            position: conflict.affectedRange,
            content: strategy.result,
            metadata: { resolved: true, strategy: strategy.type }
          }
          this.pendingChanges.set(mergedChange.id, mergedChange)
          return true
        }
        return false
        
      case 'manual':
        // User has manually resolved - apply the result
        if (strategy.result) {
          const manualChange: DocumentChange = {
            id: `manual_${conflict.id}`,
            userId: conflict.changes[0].userId,
            timestamp: new Date(),
            type: 'replace',
            position: conflict.affectedRange,
            content: strategy.result,
            metadata: { manual: true }
          }
          this.pendingChanges.set(manualChange.id, manualChange)
          return true
        }
        return false
        
      default:
        return false
    }
  }

  // Get current conflicts
  getConflicts(): ConflictInfo[] {
    return Array.from(this.conflicts.values())
  }

  // Get pending changes
  getPendingChanges(): DocumentChange[] {
    return Array.from(this.pendingChanges.values())
  }

  // Set document lock
  setLock(isLocked: boolean, owner?: string): void {
    this.isLocked = isLocked
    this.lockOwner = owner
    this.emit('lock_changed', { isLocked, owner })
  }

  // Clear resolved changes
  clearAppliedChanges(changeIds: string[]): void {
    changeIds.forEach(id => {
      this.pendingChanges.delete(id)
    })
  }

  // Reset state
  reset(): void {
    this.pendingChanges.clear()
    this.conflicts.clear()
    this.documentVersion = 0
    this.isLocked = false
    this.lockOwner = undefined
  }
}

// Factory function
export function createConflictResolver(): ConflictResolver {
  return new ConflictResolver()
}