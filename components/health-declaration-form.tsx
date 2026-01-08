'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckIcon, XIcon, ChevronLeft } from 'lucide-react';

export interface HealthDeclaration {
  // Current illnesses
  hasRespiratoryAilment: boolean;
  hasSkinInfection: boolean;
  hasGastrointestinalAilment: boolean;
  hasENTInfection: boolean;
  hasViralFever: boolean;
  hasCovid19: boolean;

  // Past illnesses
  hadPastIllness: boolean;
  pastIllnessDetails: string;

  // Recent illnesses (3 months)
  hadTyphoidDiarrhoea: boolean;

  // COVID specific
  hadRecentCovid: boolean;

  // Medication
  isOnMedication: boolean;

  // Acknowledgments
  protectiveClothingAck: boolean;
  foodDrinksAck: boolean;
  jewelryAck: boolean;
  personalHygieneAck: boolean;
  perfumeNailsAck: boolean;
  hygieneNormsAck: boolean;
}

interface HealthDeclarationFormProps {
  data: HealthDeclaration;
  onChange: (data: HealthDeclaration) => void;
  onBack: () => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export function HealthDeclarationForm({
  data,
  onChange,
  onBack,
  onSubmit,
  isLoading = false,
}: HealthDeclarationFormProps) {
  const [errors, setErrors] = useState<string[]>([]);

  const handleChange = (field: keyof HealthDeclaration, value: any) => {
    onChange({ ...data, [field]: value });
    // Clear errors when user makes changes
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    // Check if all acknowledgments are checked
    if (!data.protectiveClothingAck) {
      newErrors.push('Please acknowledge the protective clothing guidelines');
    }
    if (!data.foodDrinksAck) {
      newErrors.push('Please acknowledge the food and drinks policy');
    }
    if (!data.jewelryAck) {
      newErrors.push('Please acknowledge the jewelry/watches policy');
    }
    if (!data.personalHygieneAck) {
      newErrors.push('Please acknowledge the personal hygiene standards');
    }
    if (!data.perfumeNailsAck) {
      newErrors.push('Please acknowledge the perfume and nails policy');
    }
    if (!data.hygieneNormsAck) {
      newErrors.push('Please acknowledge that you will follow hygiene norms');
    }

    // Check if past illness details are provided when hadPastIllness is true
    if (data.hadPastIllness && !data.pastIllnessDetails.trim()) {
      newErrors.push('Please provide details about past illness');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit();
    }
  };

  const hasCurrentIllness =
    data.hasRespiratoryAilment ||
    data.hasSkinInfection ||
    data.hasGastrointestinalAilment ||
    data.hasENTInfection ||
    data.hasViralFever ||
    data.hasCovid19;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} className="p-2">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h3 className="text-xl font-semibold text-foreground">Health & Safety Declaration</h3>
          <p className="text-sm text-muted-foreground">Step 2 of 2</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800 mb-2">Please complete all required fields:</p>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety Guidelines - Acknowledgments with Icons */}
      <div className="space-y-4">
        <h4 className="font-semibold text-foreground flex items-center gap-2">
          <span className="text-2xl">📋</span> Factory Safety Guidelines
        </h4>

        {/* Protective Clothing */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-foreground mb-2">Protective Clothing</h5>
              <p className="text-sm text-muted-foreground mb-3">
                Company provided protective clothing must be worn in the factory. These must be removed when entering the toilets, canteens, external areas and offices after consuming drinks and snacks. Please ensure that all protective clothing is returned.
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.protectiveClothingAck}
                  onChange={(e) => handleChange('protectiveClothingAck', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">I acknowledge and will follow this guideline</span>
              </label>
            </div>
          </div>
        </div>

        {/* Food and Drinks */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XIcon className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-foreground mb-2">Food and Drinks</h5>
              <p className="text-sm text-muted-foreground mb-3">
                Consumption of foods and drinks is prohibited in the production area. Do not carry unsealed food or drink anywhere other than offices and canteen.
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.foodDrinksAck}
                  onChange={(e) => handleChange('foodDrinksAck', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">I acknowledge and will follow this guideline</span>
              </label>
            </div>
          </div>
        </div>

        {/* Jewelry/Watches */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XIcon className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-foreground mb-2">Jewelry/Watches</h5>
              <p className="text-sm text-muted-foreground mb-3">
                Exposed jewelry, watches, earrings, finger-rings and visible piercings are not permitted in the production areas.
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.jewelryAck}
                  onChange={(e) => handleChange('jewelryAck', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">I acknowledge and will follow this guideline</span>
              </label>
            </div>
          </div>
        </div>

        {/* Personal Hygiene */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckIcon className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-foreground mb-2">Personal Hygiene Standards</h5>
              <p className="text-sm text-muted-foreground mb-3">
                Wash your hands with soap, water, and sanitizer before entering production areas, eating, or after using toilets. Use dedicated wash stations and follow instructions at all times.
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.personalHygieneAck}
                  onChange={(e) => handleChange('personalHygieneAck', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">I acknowledge and will follow this guideline</span>
              </label>
            </div>
          </div>
        </div>

        {/* Perfume/Nails */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XIcon className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-foreground mb-2">Strong Perfume or Aftershave, False Nails</h5>
              <p className="text-sm text-muted-foreground mb-3">
                Strong perfume or aftershave and false nails are not permitted in the factory. Gloves must be worn to cover painted or false nails.
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.perfumeNailsAck}
                  onChange={(e) => handleChange('perfumeNailsAck', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">I acknowledge and will follow this guideline</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Health Declaration Checklist */}
      <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-5 md:pt-6 border-t border-border">
        <h4 className="font-semibold text-foreground flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
          <span className="text-xl sm:text-2xl">🏥</span> Health Declaration Checklist
        </h4>

        {/* Question 1: Current Illnesses */}
        <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
          <p className="font-medium text-foreground mb-2 sm:mb-3 text-xs sm:text-sm">
            1. Are you currently suffering from any of the illnesses mentioned below?
          </p>
          <div className="space-y-1.5 sm:space-y-2 ml-3 sm:ml-4">
            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hasRespiratoryAilment}
                onChange={(e) => handleChange('hasRespiratoryAilment', e.target.checked)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-foreground">Infectious respiratory ailments</span>
            </label>
            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hasSkinInfection}
                onChange={(e) => handleChange('hasSkinInfection', e.target.checked)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-foreground">Skin lesions, cuts, boils, and infections</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hasGastrointestinalAilment}
                onChange={(e) => handleChange('hasGastrointestinalAilment', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-xs sm:text-sm text-foreground">Infectious gastrointestinal ailments</span>
            </label>
            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hasENTInfection}
                onChange={(e) => handleChange('hasENTInfection', e.target.checked)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-foreground">ENT infections</span>
            </label>
            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hasViralFever}
                onChange={(e) => handleChange('hasViralFever', e.target.checked)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-foreground">Viral fever, jaundice, hepatitis, and dengue</span>
            </label>
            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.hasCovid19}
                onChange={(e) => handleChange('hasCovid19', e.target.checked)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
              />
              <span className="text-xs sm:text-sm text-foreground font-medium">COVID-19</span>
            </label>
          </div>

          {hasCurrentIllness && (
            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs sm:text-sm font-medium text-red-800">
                ⚠️ Please inform the security/reception desk about your condition before proceeding.
              </p>
            </div>
          )}
        </div>

        {/* Question 2: Past Illnesses */}
        <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
          <p className="font-medium text-foreground mb-2 sm:mb-3 text-xs sm:text-sm">
            2. Have you suffered from any of the above-mentioned illnesses in the last four months?
          </p>
          <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer mb-2 sm:mb-3">
            <input
              type="checkbox"
              checked={data.hadPastIllness}
              onChange={(e) => handleChange('hadPastIllness', e.target.checked)}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
            />
            <span className="text-xs sm:text-sm text-foreground">Yes, I had a past illness</span>
          </label>
          {data.hadPastIllness && (
            <textarea
              value={data.pastIllnessDetails}
              onChange={(e) => handleChange('pastIllnessDetails', e.target.value)}
              placeholder="Please specify the illness with an approximate date (e.g., Flu in September 2024)"
              className="w-full rounded-lg border border-border px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0"
              rows={2}
            />
          )}
        </div>

        {/* Question 3: Typhoid & Diarrhoea */}
        <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
          <p className="font-medium text-foreground mb-2 sm:mb-3 text-xs sm:text-sm">
            3. Recently (3 Months) Suffered from Typhoid & Diarrhoea
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
              <input
                type="radio"
                checked={data.hadTyphoidDiarrhoea === false}
                onChange={() => handleChange('hadTyphoidDiarrhoea', false)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-xs sm:text-sm text-foreground">No</span>
            </label>
            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
              <input
                type="radio"
                checked={data.hadTyphoidDiarrhoea === true}
                onChange={() => handleChange('hadTyphoidDiarrhoea', true)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-xs sm:text-sm text-foreground">Yes</span>
            </label>
          </div>
        </div>

        {/* Question 4: Recent COVID */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <p className="font-medium text-foreground mb-3">
            4. Have you had any pandemic-related illness in the last 2 months?
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={data.hadRecentCovid === false}
                onChange={() => handleChange('hadRecentCovid', false)}
                className="w-4 h-4 border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">No</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={data.hadRecentCovid === true}
                onChange={() => handleChange('hadRecentCovid', true)}
                className="w-4 h-4 border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">Yes</span>
            </label>
          </div>
        </div>

        {/* Question 5: Medication */}
        <div className="border border-border rounded-lg p-3 sm:p-4 bg-card">
          <p className="font-medium text-foreground mb-2 sm:mb-3 text-xs sm:text-sm">
            5. Are you currently on any medication (Allergies)?
          </p>
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
              <input
                type="radio"
                checked={data.isOnMedication === false}
                onChange={() => handleChange('isOnMedication', false)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-xs sm:text-sm text-foreground">No</span>
            </label>
            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
              <input
                type="radio"
                checked={data.isOnMedication === true}
                onChange={() => handleChange('isOnMedication', true)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-xs sm:text-sm text-foreground">Yes</span>
            </label>
          </div>
        </div>

        {/* Final Acknowledgment */}
        <div className="border-2 border-primary/20 rounded-lg p-4 bg-primary/5">
          <p className="text-sm text-foreground mb-3">
            <span className="font-medium">6. Important Notice:</span> During your visit to the food handling area, you will be required to follow personal hygiene norms displayed at the entrance of each area. Kindly cooperate with us.
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.hygieneNormsAck}
              onChange={(e) => handleChange('hygieneNormsAck', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-foreground">I acknowledge and will cooperate</span>
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={isLoading}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? 'Submitting...' : 'Submit for Approval'}
        </Button>
      </div>
    </form>
  );
}
