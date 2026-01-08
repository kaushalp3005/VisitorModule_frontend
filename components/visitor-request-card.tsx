'use client';

import { VisitorRequest } from '@/lib/types';
import { StatusBadge } from './status-badge';
import { Button } from '@/components/ui/button';
import { HealthDeclarationDisplay } from './health-declaration-display';
import { VisitorImage, VisitorThumbnail } from './visitor-image';
import { useState } from 'react';

interface VisitorRequestCardProps {
  request: VisitorRequest;
  mode: 'pending' | 'approved' | 'rejected';
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export function VisitorRequestCard({
  request,
  mode,
  onApprove,
  onReject,
  onViewDetails,
}: VisitorRequestCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg md:rounded-xl shadow-professional-lg border border-gray-200 p-3 md:p-5 lg:p-6 hover:shadow-professional transition-shadow">
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex items-start gap-3 md:gap-4">
          <VisitorThumbnail
            src={request.imageUrl}
            alt={`Photo of ${request.name}`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-base md:text-lg font-bold text-gray-900 leading-normal whitespace-normal break-words">
                  {request.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600 break-words">{request.company}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <StatusBadge status={request.status} />
                {request.isAppointment && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] md:text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 whitespace-nowrap">
                    APPOINTMENT
                  </span>
                )}
              </div>
            </div>
            {request.isAppointment && request.timeSlot && (
              <div className="mt-2 inline-flex items-center px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {request.timeSlot}
              </div>
            )}
          </div>
        </div>

        {!showDetails && (
          <div className="grid gap-2 md:gap-3 border-t border-gray-100 pt-2.5 md:pt-4">
            <div className="flex items-center gap-1.5 md:gap-2">
              <svg className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div>
                <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">Mobile</p>
                <p className="text-xs md:text-sm font-medium text-gray-900">{request.mobileNumber}</p>
              </div>
            </div>
            {request.email && (
              <div className="flex items-center gap-1.5 md:gap-2">
                <svg className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">Email</p>
                  <p className="text-xs md:text-sm font-medium text-gray-900 truncate">{request.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-1.5 md:gap-2">
              <svg className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1">
                <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">Reason</p>
                <p className="text-xs md:text-sm font-medium text-gray-900 line-clamp-2">{request.reasonForVisit}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <svg className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">Submitted</p>
                <p className="text-xs md:text-sm font-medium text-gray-900">{formatTime(request.submittedAt)}</p>
              </div>
            </div>
            {request.personToMeet && (
              <div className="flex items-center gap-1.5 md:gap-2">
                <svg className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">Person to Meet</p>
                  <p className="text-xs md:text-sm font-medium text-gray-900 break-words leading-tight">{request.personToMeet.displayName}</p>
                </div>
              </div>
            )}
            {request.warehouse && (
              <div className="flex items-center gap-1.5 md:gap-2">
                <svg className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">Warehouse</p>
                  <p className="text-xs md:text-sm font-medium text-gray-900">{request.warehouse}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {showDetails && (
          <div className="space-y-3 md:space-y-4 bg-gray-50 rounded-lg md:rounded-xl p-3 md:p-4 lg:p-5 border border-gray-200 mt-2 md:mt-4">
            <div>
              <p className="text-gray-900 font-bold mb-2 md:mb-3 lg:mb-4 text-xs md:text-sm uppercase tracking-wide">Full Details</p>
              <div className="grid gap-2 md:gap-3 text-xs md:text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-[100px]">Name:</span>
                  <span className="text-gray-900">{request.name}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-[100px]">Mobile:</span>
                  <span className="text-gray-900">{request.mobileNumber}</span>
                </div>
                {request.email && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 font-medium min-w-[100px]">Email:</span>
                    <span className="text-gray-900">{request.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-[100px]">Company:</span>
                  <span className="text-gray-900">{request.company}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-[100px]">Person to Meet:</span>
                  <span className="text-gray-900">{request.personToMeet?.displayName}</span>
                </div>
                {request.warehouse && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 font-medium min-w-[100px]">Warehouse:</span>
                    <span className="text-gray-900">{request.warehouse}</span>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-[100px]">Reason:</span>
                  <span className="text-gray-900">{request.reasonForVisit}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-[100px]">Request ID:</span>
                  <span className="text-gray-900 font-mono">{request.id}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 font-medium min-w-[100px]">Submitted:</span>
                  <span className="text-gray-900">{formatTime(request.submittedAt)}</span>
                </div>
                {request.visitorNumber && (
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 font-medium min-w-[100px]">Visitor Number:</span>
                    <span className="text-gray-900 font-mono font-bold">{request.visitorNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Visitor Selfie */}
            <div className="border-t border-gray-200 pt-2 md:pt-3 lg:pt-4">
              <p className="text-gray-900 font-bold mb-2 md:mb-3 text-xs md:text-sm uppercase tracking-wide">Visitor Photo</p>
              <div className="mt-1 md:mt-2">
                <VisitorImage
                  src={request.imageUrl}
                  alt={`Photo of ${request.name}`}
                  size="medium"
                />
              </div>
            </div>

            {/* Health Declaration */}
            {request.healthDeclaration && (
              <div className="border-t border-gray-200 pt-2 md:pt-3 lg:pt-4">
                <HealthDeclarationDisplay
                  healthDeclaration={JSON.parse(request.healthDeclaration)}
                />
              </div>
            )}
          </div>
        )}

        {mode === 'pending' && (
          <div className="flex flex-col gap-2 md:gap-3 pt-2.5 md:pt-4 border-t border-gray-100">
            <Button
              onClick={() => onApprove?.(request.id)}
              className="w-full bg-green-600 text-white hover:bg-green-700 h-9 md:h-10 lg:h-11 text-xs md:text-sm lg:text-base font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <svg className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve
            </Button>
            <Button
              onClick={() => onReject?.(request.id)}
              variant="outline"
              className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 h-9 md:h-10 lg:h-11 text-xs md:text-sm lg:text-base font-semibold"
            >
              <svg className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </Button>
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              className="w-full h-8 md:h-9 lg:h-10 text-xs md:text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              {showDetails ? 'Hide' : 'View'} Details
            </Button>
          </div>
        )}

        {mode === 'approved' && (
          <div className="flex flex-col gap-2 md:gap-3 pt-2.5 md:pt-4 border-t border-gray-100">
            <div className="rounded-lg md:rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-3 md:p-4 lg:p-5 border-2 border-green-200 shadow-sm">
              <p className="text-[10px] md:text-xs text-green-700 uppercase tracking-wide font-semibold mb-1 md:mb-2">
                Visitor Number
              </p>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold text-green-700 font-mono mb-1 md:mb-2">
                {request.visitorNumber}
              </p>
              <p className="text-[10px] md:text-xs text-green-600">Share this number with the visitor</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(request.visitorNumber || '');
                }}
                variant="outline"
                className="flex-1 h-9 md:h-10 lg:h-11 text-xs md:text-sm lg:text-base font-semibold border-gray-300 hover:bg-gray-50"
              >
                <svg className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Number
              </Button>
              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="ghost"
                className="flex-1 h-9 md:h-10 lg:h-11 text-xs md:text-sm lg:text-base font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                {showDetails ? 'Hide' : 'View'} Details
              </Button>
            </div>
          </div>
        )}

        {mode === 'rejected' && (
          <div className="flex flex-col gap-2 md:gap-3 pt-2.5 md:pt-4 border-t border-gray-100">
            {request.rejectionReason && (
              <div className="rounded-lg md:rounded-xl bg-red-50 p-2.5 md:p-3 lg:p-4 border border-red-200">
                <p className="text-[10px] md:text-xs text-red-700 uppercase tracking-wide font-semibold mb-1 md:mb-2">Rejection Reason</p>
                <p className="text-xs md:text-sm text-red-800 leading-relaxed">{request.rejectionReason}</p>
              </div>
            )}
            <Button
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
              className="w-full h-9 md:h-10 lg:h-11 text-xs md:text-sm lg:text-base font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              {showDetails ? 'Hide' : 'View'} Details
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
