'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { VisitorRequest } from './types';

type VisitorContextType = {
  requests: VisitorRequest[];
  addRequest: (request: VisitorRequest) => void;
  updateRequestStatus: (
    id: string,
    status: 'approved' | 'rejected',
    visitorNumber?: string,
    rejectionReason?: string
  ) => void;
  getRequestByMobileOrId: (mobile: string) => VisitorRequest | undefined;
  getRequestsByPersonToMeet: (personId: string) => VisitorRequest[];
};

const VisitorContext = createContext<VisitorContextType | undefined>(undefined);

export function VisitorProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<VisitorRequest[]>([]);

  const addRequest = useCallback((request: VisitorRequest) => {
    setRequests((prev) => [request, ...prev]);
  }, []);

  const updateRequestStatus = useCallback(
    (
      id: string,
      status: 'approved' | 'rejected',
      visitorNumber?: string,
      rejectionReason?: string
    ) => {
      setRequests((prev) =>
        prev.map((req) =>
          req.id === id
            ? {
                ...req,
                status,
                visitorNumber: status === 'approved' ? visitorNumber : undefined,
                approvedAt: status === 'approved' ? new Date().toISOString() : undefined,
                rejectedAt: status === 'rejected' ? new Date().toISOString() : undefined,
                rejectionReason: status === 'rejected' ? rejectionReason : undefined,
              }
            : req
        )
      );
    },
    []
  );

  const getRequestByMobileOrId = useCallback(
    (mobile: string) => {
      return requests.find(
        (r) => r.mobileNumber === mobile || r.id === mobile
      );
    },
    [requests]
  );

  const getRequestsByPersonToMeet = useCallback(
    (personId: string) => {
      return requests.filter((r) => r.personToMeet.id === personId);
    },
    [requests]
  );

  return (
    <VisitorContext.Provider
      value={{
        requests,
        addRequest,
        updateRequestStatus,
        getRequestByMobileOrId,
        getRequestsByPersonToMeet,
      }}
    >
      {children}
    </VisitorContext.Provider>
  );
}

export function useVisitors() {
  const context = useContext(VisitorContext);
  if (!context) {
    throw new Error('useVisitors must be used within VisitorProvider');
  }
  return context;
}
