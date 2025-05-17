import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class PinataService {
  private readonly logger = new Logger(PinataService.name);
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly jwt: string;
  private readonly baseUrl = 'https://api.pinata.cloud';

  constructor(private configService: ConfigService) {
    // Get credentials from environment variables or use provided values
    this.apiKey = this.configService.get<string>('PINATA_API_KEY') || '2a9bf741497886b2e4b0';
    this.apiSecret = this.configService.get<string>('PINATA_API_SECRET') || '4c654ef89c9d0521b9bed42fa32287f174c959c13c85eaf776f14e411d281749';
    this.jwt = this.configService.get<string>('PINATA_JWT') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1YmQzNDMyZC02ZDI5LTRiMjMtOThiMS01MTk4ZmNkZjIyNjMiLCJlbWFpbCI6InJhanlhdmFyZGhhbnNpbmcyMDAzQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIyYTliZjc0MTQ5Nzg4NmIyZTRiMCIsInNjb3BlZEtleVNlY3JldCI6IjRjNjU0ZWY4OWM5ZDA1MjFiOWJlZDQyZmEzMjI4N2YxNzRjOTU5YzEzYzg1ZWFmNzc2ZjE0ZTQxMWQyODE3NDkiLCJleHAiOjE3NzQ5MjY4OTR9.wjGzwyFZ9xIP0zq8tWJCXQ25SLrIN_tZv02dGtwSfrw';

    // Log status but don't expose secrets
    if (this.apiKey && this.apiSecret && this.jwt) {
      this.logger.log('Pinata credentials configured successfully');
    } else {
      this.logger.warn('Pinata credentials incomplete. File uploads may fail.');
    }
  }

  /**
   * Upload a file to Pinata/IPFS with retries and robust error handling
   * @param file File buffer and metadata
   * @param metadata Additional metadata for the file
   * @returns IPFS hash (CID) and other file info
   */
  async uploadFile(file: Express.Multer.File, metadata: any = {}, maxRetries = 3): Promise<any> {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        const formData = new FormData();
        
        // Add the file to the form data
        formData.append('file', file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype
        });
        
        // Add pinata metadata
        const pinataMetadata = {
          name: file.originalname,
          keyvalues: {
            ...metadata,
            contentType: file.mimetype,
            uploadedAt: new Date().toISOString()
          }
        };
        
        formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
        
        // Configure options for more control
        const pinataOptions = {
          cidVersion: 1,
          wrapWithDirectory: false
        };
        
        formData.append('pinataOptions', JSON.stringify(pinataOptions));
        
        // Make the request to Pinata using JWT authentication (more secure)
        const response = await axios.post(
          `${this.baseUrl}/pinning/pinFileToIPFS`,
          formData,
          {
            maxContentLength: Infinity,
            headers: {
              'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
              'Authorization': `Bearer ${this.jwt}`
            }
          }
        );
        
        this.logger.log(`File uploaded to IPFS with hash: ${response.data.IpfsHash}`);
        
        return {
          ipfsHash: response.data.IpfsHash,
          pinSize: response.data.PinSize,
          timestamp: response.data.Timestamp,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          metadata: metadata,
          gatewayUrl: this.getGatewayUrl(response.data.IpfsHash)
        };
      } catch (error) {
        attempt++;
        const errorMsg = error.response?.data?.error || error.message;
        this.logger.error(`Attempt ${attempt}/${maxRetries} failed: ${errorMsg}`);
        
        if (attempt >= maxRetries) {
          this.logger.error(`Failed to upload file to Pinata after ${maxRetries} attempts`);
          throw new InternalServerErrorException(`Failed to upload file: ${errorMsg}`);
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }

  /**
   * Unpin a file from Pinata/IPFS
   * @param ipfsHash IPFS hash (CID) of the file
   */
  async removeFile(ipfsHash: string): Promise<void> {
    try {
      await axios.delete(`${this.baseUrl}/pinning/unpin/${ipfsHash}`, {
        headers: {
          'Authorization': `Bearer ${this.jwt}`
        }
      });
      
      this.logger.log(`File with hash ${ipfsHash} unpinned from IPFS`);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      this.logger.error(`Failed to unpin file from Pinata: ${errorMsg}`);
      throw new InternalServerErrorException(`Failed to unpin file: ${errorMsg}`);
    }
  }

  /**
   * Get file metadata from Pinata
   * @param ipfsHash IPFS hash (CID) of the file
   * @returns File metadata
   */
  async getFileMetadata(ipfsHash: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/data/pinList?status=pinned&hashContains=${ipfsHash}`, {
        headers: {
          'Authorization': `Bearer ${this.jwt}`
        }
      });
      
      if (response.data.count > 0) {
        return response.data.rows[0];
      } else {
        throw new Error(`No pinned file found with hash ${ipfsHash}`);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      this.logger.error(`Failed to get file metadata from Pinata: ${errorMsg}`);
      throw new InternalServerErrorException(`Failed to get file metadata: ${errorMsg}`);
    }
  }

  /**
   * Check if a file exists on IPFS
   * @param ipfsHash IPFS hash (CID) of the file
   * @returns Boolean indicating if file exists
   */
  async fileExists(ipfsHash: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/data/pinList?status=pinned&hashContains=${ipfsHash}`, {
        headers: {
          'Authorization': `Bearer ${this.jwt}`
        }
      });
      
      return response.data.count > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get gateway URL for accessing the file
   * @param ipfsHash IPFS hash (CID) of the file
   * @returns Public gateway URL
   */
  getGatewayUrl(ipfsHash: string): string {
    // Use Pinata's dedicated gateway
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  }
}