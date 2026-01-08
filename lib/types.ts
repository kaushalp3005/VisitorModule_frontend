export type VisitorRequest = {
  id: string;
  name: string;
  mobileNumber: string;
  email: string;
  company: string;
  personToMeet: PersonToMeet;
  reasonForVisit: string;
  status: 'pending' | 'approved' | 'rejected';
  visitorNumber?: string;
  submittedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  imageUrl?: string;
  healthDeclaration?: string; // JSON string
  warehouse?: string;
  isAppointment?: boolean;
  timeSlot?: string;
};

export type PersonToMeet = {
  id: string;
  displayName: string;
  contact?: string;
};

export const PEOPLE_TO_MEET: PersonToMeet[] = [
  { id: 'yash', displayName: 'Yash – CEO' },
  { id: 'sunil', displayName: 'Sunil – CFO' },
  { id: 'nitin', displayName: 'Nitin – CBO' },
  { id: 'reception', displayName: 'Reception / Front Desk' },
];
