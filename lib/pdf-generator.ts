import jsPDF from 'jspdf';
import { VisitorRequest } from './types';

interface HealthDeclaration {
  hasRespiratoryAilment?: boolean;
  hasSkinInfection?: boolean;
  hasGastrointestinalAilment?: boolean;
  hasENTInfection?: boolean;
  hasViralFever?: boolean;
  hasCovid19?: boolean;
  hadPastIllness?: boolean;
  pastIllnessDetails?: string;
  hadTyphoidDiarrhoea?: boolean;
  hadRecentCovid?: boolean;
  isOnMedication?: boolean;
  protectiveClothingAck?: boolean;
  foodDrinksAck?: boolean;
  jewelryAck?: boolean;
  personalHygieneAck?: boolean;
  perfumeNailsAck?: boolean;
  hygieneNormsAck?: boolean;
}

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const sanitizeFilename = (s: string) =>
  s.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 60);

const loadImageAsDataURL = (url: string): Promise<{ dataUrl: string; width: number; height: number } | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

export async function generateVisitorPDF(request: VisitorRequest): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const drawHeader = () => {
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 70, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Visitor Request Details', margin, 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated: ${formatDateTime(new Date().toISOString())}`, margin, 52);
    doc.setTextColor(0, 0, 0);
    y = 90;
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(28);
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, contentWidth, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text(title.toUpperCase(), margin + 8, y + 15);
    y += 30;
  };

  const drawKeyValue = (key: string, value: string) => {
    const labelWidth = 130;
    const valueWidth = contentWidth - labelWidth - 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    const valueLines = doc.splitTextToSize(value || '-', valueWidth);
    const blockHeight = Math.max(14, valueLines.length * 12 + 2);
    ensureSpace(blockHeight + 4);
    doc.text(key, margin, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(17, 24, 39);
    doc.text(valueLines, margin + labelWidth, y + 10);
    y += blockHeight + 2;
  };

  const drawStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let bg: [number, number, number] = [156, 163, 175];
    let label = status.toUpperCase();
    if (s === 'approved') bg = [22, 163, 74];
    else if (s === 'rejected') bg = [220, 38, 38];
    else if (s === 'pending' || s === 'waiting') {
      bg = [37, 99, 235];
      label = 'PENDING';
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const textWidth = doc.getTextWidth(label) + 16;
    const badgeX = pageWidth - margin - textWidth;
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.roundedRect(badgeX, y - 2, textWidth, 18, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(label, badgeX + 8, y + 10);
    doc.setTextColor(0, 0, 0);
  };

  drawHeader();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text(request.name || 'Unknown Visitor', margin, y + 10);
  drawStatusBadge(request.status);
  y += 24;

  if (request.company) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(75, 85, 99);
    doc.text(request.company, margin, y + 10);
    y += 18;
  }
  if (request.isAppointment) {
    doc.setFillColor(243, 232, 255);
    doc.setTextColor(107, 33, 168);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const label = request.timeSlot ? `APPOINTMENT - ${request.timeSlot}` : 'APPOINTMENT';
    const w = doc.getTextWidth(label) + 12;
    doc.roundedRect(margin, y, w, 16, 4, 4, 'F');
    doc.text(label, margin + 6, y + 11);
    doc.setTextColor(0, 0, 0);
    y += 24;
  }
  y += 8;

  if (request.imageUrl) {
    const img = await loadImageAsDataURL(request.imageUrl);
    if (img) {
      const targetW = 140;
      const ratio = img.height / img.width;
      const targetH = targetW * ratio;
      ensureSpace(targetH + 20);
      try {
        doc.addImage(img.dataUrl, 'JPEG', margin, y, targetW, targetH);
        y += targetH + 16;
      } catch {
        // ignore image failure
      }
    }
  }

  drawSectionTitle('Visitor Information');
  drawKeyValue('Request ID:', request.id);
  drawKeyValue('Name:', request.name);
  drawKeyValue('Mobile:', request.mobileNumber);
  if (request.email) drawKeyValue('Email:', request.email);
  drawKeyValue('Company:', request.company);
  if (request.personToMeet?.displayName) {
    drawKeyValue('Person to Meet:', request.personToMeet.displayName);
  }
  if (request.warehouse) drawKeyValue('Warehouse:', request.warehouse);
  drawKeyValue('Reason for Visit:', request.reasonForVisit);

  drawSectionTitle('Status & Timeline');
  drawKeyValue('Status:', request.status.toUpperCase());
  drawKeyValue('Submitted At:', formatDateTime(request.submittedAt));
  if (request.visitorNumber) drawKeyValue('Visitor Number:', request.visitorNumber);
  if (request.approvedAt) drawKeyValue('Approved At:', formatDateTime(request.approvedAt));
  if (request.rejectedAt) drawKeyValue('Rejected At:', formatDateTime(request.rejectedAt));
  if (request.rejectionReason) drawKeyValue('Rejection Reason:', request.rejectionReason);

  if (request.healthDeclaration) {
    let health: HealthDeclaration | null = null;
    try {
      health = JSON.parse(request.healthDeclaration);
    } catch {
      health = null;
    }

    if (health) {
      drawSectionTitle('Health & Safety Declaration');
      const yn = (v?: boolean) => (v ? 'Yes' : 'No');
      drawKeyValue('Respiratory Ailment:', yn(health.hasRespiratoryAilment));
      drawKeyValue('Skin Infection:', yn(health.hasSkinInfection));
      drawKeyValue('Gastrointestinal Ailment:', yn(health.hasGastrointestinalAilment));
      drawKeyValue('ENT Infection:', yn(health.hasENTInfection));
      drawKeyValue('Viral Fever:', yn(health.hasViralFever));
      drawKeyValue('COVID-19:', yn(health.hasCovid19));
      drawKeyValue('Past Illness:', yn(health.hadPastIllness));
      if (health.hadPastIllness && health.pastIllnessDetails) {
        drawKeyValue('Past Illness Details:', health.pastIllnessDetails);
      }
      drawKeyValue('Typhoid/Diarrhoea (3 mo):', yn(health.hadTyphoidDiarrhoea));
      drawKeyValue('Recent Pandemic Illness:', yn(health.hadRecentCovid));
      drawKeyValue('On Medication:', yn(health.isOnMedication));

      drawSectionTitle('Safety Guidelines Acknowledged');
      drawKeyValue('Protective Clothing:', yn(health.protectiveClothingAck));
      drawKeyValue('Food & Drinks Policy:', yn(health.foodDrinksAck));
      drawKeyValue('Jewelry/Watches Policy:', yn(health.jewelryAck));
      drawKeyValue('Personal Hygiene:', yn(health.personalHygieneAck));
      drawKeyValue('Perfume/Nails Policy:', yn(health.perfumeNailsAck));
      drawKeyValue('Hygiene Norms Compliance:', yn(health.hygieneNormsAck));
    }
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 20,
      { align: 'right' }
    );
    doc.text('Candor Foods - Visitor Module', margin, pageHeight - 20);
  }

  const filename = `visitor-${sanitizeFilename(request.id)}-${sanitizeFilename(request.name || 'unknown')}.pdf`;
  doc.save(filename);
}
