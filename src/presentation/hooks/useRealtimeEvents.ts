'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeEventPayload, RealtimeEventType } from '@/infrastructure/services/events/realtime-event-bus';
import {
  playCommerceNewOrderAlert,
  playDriverAssignedToStoreAlert,
  playDriverNewDeliveryAlert,
  playCustomerOrderInRouteAlert,
  playCustomerOrderArrivedDoorAlert,
} from '@/presentation/utils/audioAlerts';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface UseRealtimeEventsOptions {
  channels: string | string[];
  enabled?: boolean;
  onEvent?: (event: RealtimeEventPayload) => void;
  onOrderCreated?: (data: any) => void;
  onOrderPaid?: (data: any) => void;
  onOrderStatusUpdated?: (data: any) => void;
  onOrderReadyForPickup?: (data: any) => void;
  onOrderDriverAssigned?: (data: any) => void;
  onOrderInRoute?: (data: any) => void;
  onOrderDelivered?: (data: any) => void;
  enableAudioAlerts?: boolean;
}

export function useRealtimeEvents(options: UseRealtimeEventsOptions) {
  const {
    channels,
    enabled = true,
    onEvent,
    onOrderCreated,
    onOrderPaid,
    onOrderStatusUpdated,
    onOrderReadyForPickup,
    onOrderDriverAssigned,
    onOrderInRoute,
    onOrderDelivered,
    enableAudioAlerts = true,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload | null>(null);

  // Usar refs para todos los callbacks para evitar loops infinitos de re-render y reconexión
  const callbacksRef = useRef({
    onEvent,
    onOrderCreated,
    onOrderPaid,
    onOrderStatusUpdated,
    onOrderReadyForPickup,
    onOrderDriverAssigned,
    onOrderInRoute,
    onOrderDelivered,
    enableAudioAlerts,
  });

  useEffect(() => {
    callbacksRef.current = {
      onEvent,
      onOrderCreated,
      onOrderPaid,
      onOrderStatusUpdated,
      onOrderReadyForPickup,
      onOrderDriverAssigned,
      onOrderInRoute,
      onOrderDelivered,
      enableAudioAlerts,
    };
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  // Normalizar lista de canales como string primitivo estable
  const normalizedChannels = Array.isArray(channels)
    ? channels.filter(Boolean).sort().join(',')
    : channels || '';

  const handleMessage = useCallback((eventPayload: RealtimeEventPayload) => {
    setLastEvent(eventPayload);
    const cb = callbacksRef.current;

    // 1. Callback genérico
    if (cb.onEvent) {
      cb.onEvent(eventPayload);
    }

    // 2. Callbacks específicos y alertas sonoras
    const { type, data } = eventPayload;

    switch (type) {
      case 'order:created':
        if (cb.enableAudioAlerts) playCommerceNewOrderAlert();
        if (cb.onOrderCreated) cb.onOrderCreated(data);
        break;

      case 'order:paid':
        if (cb.enableAudioAlerts) playCommerceNewOrderAlert();
        if (cb.onOrderPaid) cb.onOrderPaid(data);
        break;

      case 'order:ready_for_pickup':
        if (cb.enableAudioAlerts) playDriverNewDeliveryAlert();
        if (cb.onOrderReadyForPickup) cb.onOrderReadyForPickup(data);
        break;

      case 'order:driver_assigned':
        if (cb.enableAudioAlerts) playDriverAssignedToStoreAlert();
        if (cb.onOrderDriverAssigned) cb.onOrderDriverAssigned(data);
        break;

      case 'order:in_route':
        if (cb.enableAudioAlerts) playCustomerOrderInRouteAlert();
        if (cb.onOrderInRoute) cb.onOrderInRoute(data);
        break;

      case 'order:delivered':
        if (cb.enableAudioAlerts) playCustomerOrderArrivedDoorAlert();
        if (cb.onOrderDelivered) cb.onOrderDelivered(data);
        break;

      case 'order:status_updated':
        if (cb.onOrderStatusUpdated) cb.onOrderStatusUpdated(data);
        break;

      default:
        break;
    }
  }, []);

  const connect = useCallback(() => {
    if (typeof window === 'undefined' || !enabled || !normalizedChannels) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnectionStatus('connecting');

    try {
      const url = `/api/realtime/stream?channels=${encodeURIComponent(normalizedChannels)}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      };

      es.addEventListener('system:connected', () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
      });

      es.onmessage = (e: MessageEvent) => {
        try {
          if (!e.data || e.data.startsWith(':')) return;
          const payload = JSON.parse(e.data) as RealtimeEventPayload;
          handleMessage(payload);
        } catch {
          // Ignorar pings
        }
      };

      const eventTypes: RealtimeEventType[] = [
        'order:created',
        'order:paid',
        'order:status_updated',
        'order:ready_for_pickup',
        'order:driver_assigned',
        'order:in_route',
        'order:delivered',
        'order:cancelled',
      ];

      eventTypes.forEach((type) => {
        es.addEventListener(type, (e: MessageEvent) => {
          try {
            const payload = JSON.parse(e.data) as RealtimeEventPayload;
            handleMessage(payload);
          } catch (err) {
            console.error('[SSE Hook] Error parsing event data:', err);
          }
        });
      });

      es.onerror = () => {
        if (es.readyState === EventSource.CLOSED) {
          es.close();
          eventSourceRef.current = null;
          setConnectionStatus('reconnecting');

          const delay = Math.min(2000 * Math.pow(1.5, reconnectAttemptsRef.current), 15000);
          reconnectAttemptsRef.current += 1;

          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch {
      setConnectionStatus('disconnected');
    }
  }, [enabled, normalizedChannels, handleMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    lastEvent,
    reconnect,
  };
}
