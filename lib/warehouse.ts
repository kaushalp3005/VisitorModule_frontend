// The A185 QR opens /?warehouse=A185; the plain link is W202.
// Used only when the person being met has no warehouse of their own.
export const DEFAULT_WAREHOUSE = 'W202';

// Link back to the check-in form that keeps the visitor on the same warehouse.
export const registrationHref = (warehouse?: string | null) =>
  warehouse && warehouse !== DEFAULT_WAREHOUSE ? `/?warehouse=${encodeURIComponent(warehouse)}` : '/';
