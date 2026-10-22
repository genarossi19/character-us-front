import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { createRoomRecovery } from "@/services/socket/roomRecovery";
import { toast } from "sonner";

export function useRoomRecovery() {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  const controller = useRef<ReturnType<typeof createRoomRecovery> | null>(null);
  useEffect(() => {
    const recovery = createRoomRecovery((path) => navigateRef.current(path, { replace: true }), (message) => toast.error(message));
    controller.current = recovery;
    return () => { recovery.dispose(); controller.current = null; };
  }, []);
  return () => controller.current?.recover();
}
