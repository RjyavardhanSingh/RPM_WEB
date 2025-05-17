import { BaseApi } from './base-api';

export interface VerificationResult {
  verified: boolean;
  message: string;
  originalData?: any;
  timestamp?: string;
  txHash?: string;
}

export class BlockchainService extends BaseApi {
  async verify(type: 'medical-record' | 'vital-sign' | 'file', id: string): Promise<VerificationResult> {
    const response = await this.get<VerificationResult>(`/blockchain/verify/${type}/${id}`);
    return response.data;
  }

  async getTransactionDetails(txHash: string): Promise<any> {
    const response = await this.get<any>(`/blockchain/transaction/${txHash}`);
    return response.data;
  }
}

export const blockchainService = new BlockchainService();