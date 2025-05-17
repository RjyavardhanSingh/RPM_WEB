/**
 * Represents a file attachment for a medical record
 */
export interface MedicalRecordFile {
  id: string;
  name: string;
  ipfsHash: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  gatewayUrl?: string;
  blockchainTxHash?: string | null;
  [key: string]: any; // Allow additional dynamic properties
}

/**
 * Represents metadata returned from Pinata IPFS service
 */
export interface PinataMetadata {
  ipfsHash: string;
  pinSize?: number;
  timestamp?: string;
  gatewayUrl?: string;
  [key: string]: any;
}