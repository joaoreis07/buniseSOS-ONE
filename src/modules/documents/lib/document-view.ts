export type DocumentField = {
  label: string;
  value: string;
};

export type DocumentLine = {
  description: string;
  quantity: string;
  total: string;
};

export type DocumentTotal = {
  label: string;
  value: string;
  emphasize?: boolean;
};

export type OperationalDocumentView = {
  document: {
    id: string;
    kind: "SALE_RECEIPT" | "PAYMENT_RECEIPT" | "PURCHASE_RECORD";
    number: number;
  };
  issuedAtLabel: string;
  company: {
    displayName: string;
    document: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    website: string | null;
    address: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    documentTitle: string | null;
    documentHeader: string | null;
    documentFooter: string | null;
    signature: string;
    hasLogo: boolean;
  };
  fields: DocumentField[];
  lines: DocumentLine[];
  totals: DocumentTotal[];
  notes: string | null;
  backHref: string;
  pdfHref: string;
};
