"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppSelector } from "@/store/hooks";
import { getAuthToken } from "@/lib/api";
import { getSocket, disconnectSocket } from "@/lib/socket";

export interface CheckinCompletedEvent {
  eventId: string;
  event: "CHECKIN_COMPLETED";
  timestamp: string;
  requestId?: string;
  data: {
    guestId: string;
    confirmationNumber?: string;
    checkedInAt: string;
    checkedInBy: string;
    verificationMethod: "CONFIRMATION" | "PHONE";
  };
}

export interface GuestRegisteredEvent {
  eventId: string;
  event: "GUEST_REGISTERED";
  timestamp: string;
  requestId?: string;
  data: {
    guestId: string;
    confirmationNumber?: string;
    registeredAt: string;
  };
}

interface UseWebSocketOptions {
  onCheckinCompleted?: (event: CheckinCompletedEvent) => void;
  onGuestRegistered?: (event: GuestRegisteredEvent) => void;
  onReconnect?: () => void;
}

export function useWebSocket({
  onCheckinCompleted,
  onGuestRegistered,
  onReconnect,
}: UseWebSocketOptions = {}) {
  const { user } = useAuth();
  const { appUser } = useAppSelector((state) => state.auth);

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Store latest callbacks in refs to avoid re-subscribing socket listeners on every render
  const onCheckinRef = useRef(onCheckinCompleted);
  const onGuestRegRef = useRef(onGuestRegistered);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => {
    onCheckinRef.current = onCheckinCompleted;
    onGuestRegRef.current = onGuestRegistered;
    onReconnectRef.current = onReconnect;
  }, [onCheckinCompleted, onGuestRegistered, onReconnect]);

  useEffect(() => {
    // Only connect if user is authenticated and is an active ADMIN
    if (!user || !appUser || appUser.role !== "ADMIN" || !appUser.isActive) {
      disconnectSocket();
      return;
    }

    let isSubscribed = true;

    async function connect() {
      try {
        const token = await getAuthToken();
        if (!token || !isSubscribed) {
          return;
        }

        const socket = getSocket(token);

        const handleConnect = () => {
          if (isSubscribed) {
            setIsConnected(true);
            setIsReconnecting(false);
            setError(null);
          }
        };

        const handleDisconnect = (reason: string) => {
          if (isSubscribed) {
            setIsConnected(false);
          }
          if (reason === "io server disconnect") {
            socket.connect();
          }
        };

        const handleConnectError = (err: Error) => {
          if (isSubscribed) {
            setIsConnected(false);
            setError(err.message || "Failed to connect to real-time notification service.");
          }
        };

        const handleReconnectAttempt = () => {
          if (isSubscribed) {
            setIsReconnecting(true);
          }
        };

        const handleReconnect = () => {
          if (isSubscribed) {
            setIsConnected(true);
            setIsReconnecting(false);
            setError(null);

            // When reconnecting, immediately refresh authoritative REST data
            if (onReconnectRef.current) {
              onReconnectRef.current();
            } else {
              if (onCheckinRef.current) {
                onCheckinRef.current({} as CheckinCompletedEvent);
              }
              if (onGuestRegRef.current) {
                onGuestRegRef.current({} as GuestRegisteredEvent);
              }
            }
          }
        };

        const handleCheckinCompleted = (event: CheckinCompletedEvent) => {
          if (onCheckinRef.current) {
            onCheckinRef.current(event);
          }
        };

        const handleGuestRegistered = (event: GuestRegisteredEvent) => {
          if (onGuestRegRef.current) {
            onGuestRegRef.current(event);
          }
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.io.on("reconnect_attempt", handleReconnectAttempt);
        socket.io.on("reconnect", handleReconnect);

        socket.on("CHECKIN_COMPLETED", handleCheckinCompleted);
        socket.on("GUEST_REGISTERED", handleGuestRegistered);

        if (socket.connected && isSubscribed) {
          setIsConnected(true);
        }
      } catch (err: unknown) {
        if (isSubscribed) {
          setError(
            err instanceof Error
              ? err.message
              : "Unexpected WebSocket initialization error"
          );
        }
      }
    }

    void connect();

    return () => {
      isSubscribed = false;
      const socket = getSocket("");
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
        socket.io.off("reconnect_attempt");
        socket.io.off("reconnect");
        socket.off("CHECKIN_COMPLETED");
        socket.off("GUEST_REGISTERED");
      }
    };
  }, [user, appUser]);

  return {
    isConnected,
    isReconnecting,
    error,
  };
}

export default useWebSocket;

