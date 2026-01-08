import React from 'react';

interface HealthDeclaration {
  hasRespiratoryAilment: boolean;
  hasSkinInfection: boolean;
  hasGastrointestinalAilment: boolean;
  hasENTInfection: boolean;
  hasViralFever: boolean;
  hasCovid19: boolean;
  hadPastIllness: boolean;
  pastIllnessDetails: string;
  hadTyphoidDiarrhoea: boolean;
  hadRecentCovid: boolean;
  isOnMedication: boolean;
  protectiveClothingAck: boolean;
  foodDrinksAck: boolean;
  jewelryAck: boolean;
  personalHygieneAck: boolean;
  perfumeNailsAck: boolean;
  hygieneNormsAck: boolean;
}

interface HealthDeclarationDisplayProps {
  healthDeclaration: HealthDeclaration;
}

export function HealthDeclarationDisplay({ healthDeclaration }: HealthDeclarationDisplayProps) {
  const hasAnyCurrentIllness =
    healthDeclaration.hasRespiratoryAilment ||
    healthDeclaration.hasSkinInfection ||
    healthDeclaration.hasGastrointestinalAilment ||
    healthDeclaration.hasENTInfection ||
    healthDeclaration.hasViralFever ||
    healthDeclaration.hasCovid19;

  const allAcknowledgmentsComplete =
    healthDeclaration.protectiveClothingAck &&
    healthDeclaration.foodDrinksAck &&
    healthDeclaration.jewelryAck &&
    healthDeclaration.personalHygieneAck &&
    healthDeclaration.perfumeNailsAck &&
    healthDeclaration.hygieneNormsAck;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Health & Safety Declaration</h3>
        {hasAnyCurrentIllness ? (
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
            <svg className="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Health Issue Reported
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            <svg className="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Healthy
          </span>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        {/* Current Health Status */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Current Health Status</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {[
              { label: 'Respiratory Ailment', value: healthDeclaration.hasRespiratoryAilment },
              { label: 'Skin Infection', value: healthDeclaration.hasSkinInfection },
              { label: 'Gastrointestinal Ailment', value: healthDeclaration.hasGastrointestinalAilment },
              { label: 'ENT Infection', value: healthDeclaration.hasENTInfection },
              { label: 'Viral Fever/Dengue/Hepatitis', value: healthDeclaration.hasViralFever },
              { label: 'COVID-19', value: healthDeclaration.hasCovid19 },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-muted-foreground">{item.label}:</span>
                <span className={`font-medium ${item.value ? 'text-red-600' : 'text-green-600'}`}>
                  {item.value ? 'Yes' : 'No'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Past Illness */}
        <div className="border-t border-border pt-3">
          <p className="text-sm font-medium text-foreground mb-2">Past Medical History (Last 4 Months)</p>
          <div className="text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-muted-foreground">Had Past Illness:</span>
              <span className={`font-medium ${healthDeclaration.hadPastIllness ? 'text-yellow-600' : 'text-green-600'}`}>
                {healthDeclaration.hadPastIllness ? 'Yes' : 'No'}
              </span>
            </div>
            {healthDeclaration.hadPastIllness && healthDeclaration.pastIllnessDetails && (
              <div className="mt-2 rounded-md bg-yellow-50 border border-yellow-200 p-2">
                <p className="text-xs font-medium text-yellow-800 mb-1">Details:</p>
                <p className="text-xs text-yellow-900">{healthDeclaration.pastIllnessDetails}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Illnesses */}
        <div className="border-t border-border pt-3">
          <p className="text-sm font-medium text-foreground mb-2">Recent Medical History (3 Months)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Typhoid & Diarrhoea:</span>
              <span className={`font-medium ${healthDeclaration.hadTyphoidDiarrhoea ? 'text-yellow-600' : 'text-green-600'}`}>
                {healthDeclaration.hadTyphoidDiarrhoea ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* COVID-19 Status */}
        <div className="border-t border-border pt-3">
          <p className="text-sm font-medium text-foreground mb-2">COVID-19 Status</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pandemic-related illness (2 months):</span>
              <span className={`font-medium ${healthDeclaration.hadRecentCovid ? 'text-yellow-600' : 'text-green-600'}`}>
                {healthDeclaration.hadRecentCovid ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Medication */}
        <div className="border-t border-border pt-3">
          <p className="text-sm font-medium text-foreground mb-2">Current Medication</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">On Medication (Allergies):</span>
              <span className={`font-medium ${healthDeclaration.isOnMedication ? 'text-yellow-600' : 'text-green-600'}`}>
                {healthDeclaration.isOnMedication ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Safety Acknowledgments */}
        <div className="border-t border-border pt-3">
          <p className="text-sm font-medium text-foreground mb-2">Safety Guidelines Acknowledgment</p>
          <div className={`rounded-md p-3 ${allAcknowledgmentsComplete ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {allAcknowledgmentsComplete ? (
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-800">All safety guidelines acknowledged</span>
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="h-5 w-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-red-800">Incomplete safety acknowledgments</span>
              </div>
            )}
            <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
              {[
                { label: 'Protective Clothing', value: healthDeclaration.protectiveClothingAck },
                { label: 'Food and Drinks Policy', value: healthDeclaration.foodDrinksAck },
                { label: 'Jewelry/Watches Policy', value: healthDeclaration.jewelryAck },
                { label: 'Personal Hygiene Standards', value: healthDeclaration.personalHygieneAck },
                { label: 'Perfume/Nails Policy', value: healthDeclaration.perfumeNailsAck },
                { label: 'Hygiene Norms Compliance', value: healthDeclaration.hygieneNormsAck },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  {item.value ? (
                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
