'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/app-header';
import { PageContainer } from '@/components/page-container';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useVisitors } from '@/lib/visitor-store';
import { VisitorRequest } from '@/lib/types';
import { API_ENDPOINTS } from '@/lib/api-config';
import { HealthDeclarationDisplay } from '@/components/health-declaration-display';
import { VisitorImage } from '@/components/visitor-image';

type SearchMode = 'mobile' | 'reference';

export default function StatusPage() {
  const { getRequestByMobileOrId } = useVisitors();
  const [searchMode, setSearchMode] = useState<SearchMode>('mobile');
  const [searchInput, setSearchInput] = useState('');
  const [foundRequest, setFoundRequest] = useState<VisitorRequest | null>(null);
  const [foundRequests, setFoundRequests] = useState<VisitorRequest[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFoundRequest(null);
    setFoundRequests([]);
    setIsLoading(true);

    if (!searchInput.trim()) {
      setError(`Please enter a ${searchMode === 'mobile' ? 'mobile number' : 'reference ID'}.`);
      setIsLoading(false);
      return;
    }

    if (searchMode === 'mobile' && !/^\d{10}$/.test(searchInput)) {
      setError('Mobile number must be exactly 10 digits.');
      setIsLoading(false);
      return;
    }

    if (searchMode === 'reference' && !/^\d+$/.test(searchInput.trim())) {
      setError('Reference ID must contain only numbers (e.g., 20251120121617).');
      setIsLoading(false);
      return;
    }

    try {
      let response;
      let data;

      if (searchMode === 'mobile') {
        // Fetch from backend API by phone number
        response = await fetch(`${API_ENDPOINTS.visitors}/phone/${searchInput.trim()}`);

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        data = await response.json();

        if (!data || data.length === 0) {
          setError('No visit request found. Please check your details and try again.');
          setIsLoading(false);
          setSearched(true);
          return;
        }

        // Map all visitor records and sort by most recent first
        const allVisitors = await Promise.all(
          data.map((visitor: any) => mapVisitorToRequest(visitor))
        );
        setFoundRequests(allVisitors);
      } else {
        // Search by reference ID from backend API (numeric only)
        const numericId = searchInput.trim();

        response = await fetch(`${API_ENDPOINTS.visitors}/${numericId}`);

        if (response.status === 404) {
          setError('No visit request found. Please check your reference ID and try again.');
          setIsLoading(false);
          setSearched(true);
          return;
        }

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        data = await response.json();
        const mappedRequest = await mapVisitorToRequest(data);
        setFoundRequest(mappedRequest);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to fetch visitor data. Please try again.');
    } finally {
      setIsLoading(false);
      setSearched(true);
    }
  };

  const fetchApproverDetails = async (username: string): Promise<{ name: string; phone: string }> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.approvers}/${username}`);
      if (!response.ok) {
        return { name: username, phone: '' }; // Fallback to username if fetch fails
      }
      const data = await response.json();
      return {
        name: data.name || username,
        phone: data.ph_no || ''
      };
    } catch (error) {
      console.error('Error fetching approver details:', error);
      return { name: username, phone: '' }; // Fallback to username if error occurs
    }
  };

  const mapVisitorToRequest = async (visitorData: any): Promise<VisitorRequest> => {
    const approverDetails = await fetchApproverDetails(visitorData.person_to_meet);

    // Normalize status to lowercase
    const normalizedStatus = visitorData.status.toLowerCase();

    return {
      id: `VIS-${visitorData.id}`,
      name: visitorData.visitor_name,
      mobileNumber: visitorData.mobile_number,
      email: visitorData.email_address,
      company: visitorData.company,
      personToMeet: {
        id: visitorData.person_to_meet,
        displayName: approverDetails.name,
        contact: approverDetails.phone,
      },
      reasonForVisit: visitorData.reason_to_visit,
      status: normalizedStatus === 'waiting' ? 'pending' : normalizedStatus,
      submittedAt: visitorData.check_in_time,
      visitorNumber: normalizedStatus === 'approved' ? visitorData.id : undefined,
      approvedAt: normalizedStatus === 'approved' ? visitorData.updated_at : undefined,
      imageUrl: visitorData.img_url || visitorData.image_url, // Support both field names
      healthDeclaration: visitorData.health_declaration,
      warehouse: visitorData.warehouse,
    };
  };

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

  const generateQRCode = (text: string): string => {
    // Simple placeholder QR code generator using a public service
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  };

  return (
    <>
      <AppHeader
        rightContent={
          <Link href="/">
            <Button variant="outline" size="sm">
              Back to Check-In
            </Button>
          </Link>
        }
      />

      <PageContainer>
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Check Your Visit Status</h1>
            <p className="mt-2 text-muted-foreground">
              Enter your details to view the status of your visit request.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="rounded-lg border border-border bg-card p-6 space-y-6">
            {/* Search Mode Toggle */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchMode"
                  value="mobile"
                  checked={searchMode === 'mobile'}
                  onChange={(e) => {
                    setSearchMode(e.target.value as SearchMode);
                    setSearchInput('');
                    setError('');
                    setFoundRequest(null);
                    setFoundRequests([]);
                    setSearched(false);
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-foreground">Search by Mobile Number</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="searchMode"
                  value="reference"
                  checked={searchMode === 'reference'}
                  onChange={(e) => {
                    setSearchMode(e.target.value as SearchMode);
                    setSearchInput('');
                    setError('');
                    setFoundRequest(null);
                    setFoundRequests([]);
                    setSearched(false);
                  }}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium text-foreground">Search by Reference ID</span>
              </label>
            </div>

            {/* Input Field */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-foreground mb-2">
                {searchMode === 'mobile' ? 'Mobile Number' : 'Reference ID'}
              </label>
              <input
                type={searchMode === 'mobile' ? 'tel' : 'text'}
                id="search"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setError('');
                  setFoundRequest(null);
                  setFoundRequests([]);
                  setSearched(false);
                }}
                placeholder={
                  searchMode === 'mobile'
                    ? 'Enter your 10-digit mobile number'
                    : 'Enter your reference ID (e.g., 20251120121617)'
                }
                className="w-full rounded-lg border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? 'Searching...' : 'Check Status'}
            </Button>
          </form>

          {/* Error Message */}
          {error && searched && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Results for Mobile Number Search (Multiple Records) */}
          {foundRequests.length > 0 && searched && (
            <div className="space-y-4">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Found {foundRequests.length} visit{foundRequests.length > 1 ? 's' : ''}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Showing all visit requests for this mobile number
                </p>
              </div>

              {foundRequests.map((request, index) => (
                <div key={request.id} className="rounded-lg border border-border bg-card p-6 space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{request.name}</h3>
                      <p className="text-sm text-muted-foreground">Reference ID: {request.id.replace('VIS-', '')}</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>

                  {/* Status Message */}
                  {request.status === 'pending' && (
                    <>
                      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                        <p className="text-yellow-800 text-sm">
                          Your visit is awaiting approval from{' '}
                          <strong>{request.personToMeet.displayName}</strong>.
                        </p>
                      </div>
                      {request.personToMeet.contact && (
                        <a href={`tel:${request.personToMeet.contact}`} className="block mb-8">
                          <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                            <svg
                              className="h-4 w-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            Call {request.personToMeet.displayName}
                          </Button>
                        </a>
                      )}
                    </>
                  )}

                  {request.status === 'rejected' && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                      <p className="text-red-800 text-sm mb-2">
                        Unfortunately, your visit request has been rejected.
                      </p>
                      {request.rejectionReason && (
                        <p className="text-red-700 text-sm">
                          <strong>Reason:</strong> {request.rejectionReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Company
                      </p>
                      <p className="mt-1 text-foreground">{request.company}</p>
                    </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Person to Meet
                    </p>
                    <p className="mt-1 text-foreground">{request.personToMeet.displayName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Submitted At
                    </p>
                    <p className="mt-1 text-foreground text-sm">{formatTime(request.submittedAt)}</p>
                  </div>
                  </div>

                  {/* Reason for Visit */}
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Reason for Visit
                    </p>
                    <p className="text-foreground">{request.reasonForVisit}</p>
                  </div>

                  {/* Warehouse */}
                  {request.warehouse && (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Warehouse
                      </p>
                      <p className="text-foreground font-medium">{request.warehouse}</p>
                    </div>
                  )}

                  {/* Visitor Selfie */}
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Visitor Photo
                    </p>
                    <div className="mt-2">
                      <VisitorImage
                        src={request.imageUrl}
                        alt={`Photo of ${request.name}`}
                        size="medium"
                      />
                    </div>
                  </div>

                  {/* Health Declaration */}
                  {request.healthDeclaration && (
                    <div className="border-t border-border pt-4">
                      <HealthDeclarationDisplay
                        healthDeclaration={JSON.parse(request.healthDeclaration)}
                      />
                    </div>
                  )}

                  {/* Approved State */}
                  {request.status === 'approved' && request.visitorNumber && (
                    <div className="border-t border-border pt-4 space-y-4">
                      <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                        <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-2">
                          Your Visitor Number
                        </p>
                        <p className="text-4xl font-bold font-mono text-green-700 mb-3">
                          {request.visitorNumber}
                        </p>
                        <p className="text-sm text-green-700">
                          Present this number at the reception desk to complete your check-in.
                        </p>
                      </div>

                      {request.personToMeet.contact && (
                        <a href={`tel:${request.personToMeet.contact}`} className="block mb-8">
                          <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                            <svg
                              className="h-4 w-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            Call {request.personToMeet.displayName}
                          </Button>
                        </a>
                      )}

                      <div className="flex gap-3">
                        <div className="flex-1">
                          <img
                            src={generateQRCode(request.visitorNumber) || "/placeholder.svg"}
                            alt="QR Code"
                            className="w-full h-auto max-w-[200px] mx-auto"
                          />
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(request.visitorNumber || '');
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            Copy Number
                          </Button>
                          {request.approvedAt && (
                            <div className="rounded-lg bg-muted p-3">
                              <p className="text-xs text-muted-foreground">Approved At</p>
                              <p className="text-sm font-medium text-foreground">
                                {formatTime(request.approvedAt)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Link href="/">
                <Button variant="outline" className="w-full">
                  Submit Another Request
                </Button>
              </Link>
            </div>
          )}

          {/* Result for Reference ID Search (Single Record) */}
          {foundRequest && searched && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">{foundRequest.name}</h2>
                  <StatusBadge status={foundRequest.status} />
                </div>

                {/* Status Message */}
                {foundRequest.status === 'pending' && (
                  <>
                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                      <p className="text-yellow-800 text-sm">
                        Your visit is awaiting approval from{' '}
                        <strong>{foundRequest.personToMeet.displayName}</strong>.
                      </p>
                    </div>
                    {foundRequest.personToMeet.contact && (
                      <a href={`tel:${foundRequest.personToMeet.contact}`} className="block mb-8">
                        <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                          <svg
                            className="h-4 w-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          Call {foundRequest.personToMeet.displayName}
                        </Button>
                      </a>
                    )}
                  </>
                )}

                {foundRequest.status === 'rejected' && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                    <p className="text-red-800 text-sm mb-2">
                      Unfortunately, your visit request has been rejected.
                    </p>
                    {foundRequest.rejectionReason && (
                      <p className="text-red-700 text-sm">
                        <strong>Reason:</strong> {foundRequest.rejectionReason}
                      </p>
                    )}
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Company
                    </p>
                    <p className="mt-1 text-foreground">{foundRequest.company}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Person to Meet
                    </p>
                    <p className="mt-1 text-foreground">{foundRequest.personToMeet.displayName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Submitted At
                    </p>
                    <p className="mt-1 text-foreground text-sm">{formatTime(foundRequest.submittedAt)}</p>
                  </div>
                </div>

                {/* Reason for Visit */}
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Reason for Visit
                  </p>
                  <p className="text-foreground">{foundRequest.reasonForVisit}</p>
                </div>

                {/* Warehouse */}
                {foundRequest.warehouse && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                      Warehouse
                    </p>
                    <p className="text-foreground font-medium">{foundRequest.warehouse}</p>
                  </div>
                )}

                {/* Visitor Selfie */}
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Visitor Photo
                  </p>
                  <div className="mt-2">
                    <VisitorImage
                      src={foundRequest.imageUrl}
                      alt={`Photo of ${foundRequest.name}`}
                      size="medium"
                    />
                  </div>
                </div>

                {/* Health Declaration */}
                {foundRequest.healthDeclaration && (
                  <div className="border-t border-border pt-4">
                    <HealthDeclarationDisplay
                      healthDeclaration={JSON.parse(foundRequest.healthDeclaration)}
                    />
                  </div>
                )}

                {/* Approved State */}
                {foundRequest.status === 'approved' && foundRequest.visitorNumber && (
                  <div className="border-t border-border pt-4 space-y-4">
                    <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                      <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-2">
                        Your Visitor Number
                      </p>
                      <p className="text-4xl font-bold font-mono text-green-700 mb-3">
                        {foundRequest.visitorNumber}
                      </p>
                      <p className="text-sm text-green-700">
                        Present this number at the reception desk to complete your check-in.
                      </p>
                    </div>

                    {foundRequest.personToMeet.contact && (
                      <a href={`tel:${foundRequest.personToMeet.contact}`} className="block mb-8">
                        <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                          <svg
                            className="h-4 w-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          Call {foundRequest.personToMeet.displayName}
                        </Button>
                      </a>
                    )}

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <img
                          src={generateQRCode(foundRequest.visitorNumber) || "/placeholder.svg"}
                          alt="QR Code"
                          className="w-full h-auto max-w-[200px] mx-auto"
                        />
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(foundRequest.visitorNumber || '');
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          Copy Number
                        </Button>
                        {foundRequest.approvedAt && (
                          <div className="rounded-lg bg-muted p-3">
                            <p className="text-xs text-muted-foreground">Approved At</p>
                            <p className="text-sm font-medium text-foreground">
                              {formatTime(foundRequest.approvedAt)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/">
                <Button variant="outline" className="w-full">
                  Submit Another Request
                </Button>
              </Link>
            </div>
          )}
        </div>
      </PageContainer>
    </>
  );
}
