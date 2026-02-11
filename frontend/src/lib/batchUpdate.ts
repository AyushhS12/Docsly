import { useCallback, useRef } from "react";
import type { DeleteUpdate, InsertUpdate } from "./utils";

export function useBatchUpdates(sendUpdate: (update: InsertUpdate| DeleteUpdate ) => void) {
  const pendingUpdateRef = useRef<InsertUpdate| DeleteUpdate | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. FLUSH: Sends the data immediately and clears state
  const flush = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (pendingUpdateRef.current) {
      const updateToSend = {
        ...pendingUpdateRef.current,
        timestamp: new Date().toISOString()
      };
      sendUpdate(updateToSend);
      
      pendingUpdateRef.current = null;
    }
  }, [sendUpdate]);

  // 2. QUEUE: The main logic
  const queueUpdate = useCallback((newUpdate: InsertUpdate | DeleteUpdate) => {
    const pending = pendingUpdateRef.current;

    // --- CASE 1: No batch exists, start one ---
    if (!pending) {
      pendingUpdateRef.current = newUpdate;
    } 
    
    // --- CASE 2: Batch exists, try to merge ---
    else {
      const isTypeMatch = pending.type.update === newUpdate.type.update;
      let isContiguous = false;

      if (isTypeMatch) {
        if (pending.type.update === "insert" && newUpdate.type.update === "insert") {
          // INSERT MERGE:
          // Valid if New Pos == Old Pos + Old Length
          // Ex: "Hel" at 0 (len 3). Next char "l" comes at 3. Match!
          if (newUpdate.position === pending.position + pending.type.data.length) {
            pending.type.data += newUpdate.type.data;
            isContiguous = true;
          }
        } 
        else if (pending.type.update === "delete" && newUpdate.type.update === "delete") {
          flush()
          // DELETE MERGE:
          // Valid if New Pos == Old Pos (User hit Delete key repeatedly)
          if (newUpdate.position === pending.position) {
             pending.type.length += newUpdate.type.length;
             isContiguous = true;
          }
          // Note: Backspace merging is complex because positions shift backward. 
          // For safety, we usually flush backspaces immediately unless you calculate the shift.
        }
      }

      // If we couldn't merge (cursor moved, or type changed), flush old and start new
      if (!isContiguous) {
        flush();
        pendingUpdateRef.current = newUpdate;
      }
    }

    // 3. Reset Timer (Debounce)
    // 500ms - 1000ms is usually better for real-time feel than 3000ms
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(flush, 1000); 
    
  }, [flush]);
  return {queueUpdate, flush}
}