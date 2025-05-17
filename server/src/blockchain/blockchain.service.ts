import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { ethers } from 'ethers';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly privateKey: string;
  private readonly account;
  private readonly walletClient;
  private readonly publicClient;
  
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    // Fix: Add null checking for the private key
    const privateKeyValue = this.configService.get<string>('BLOCKCHAIN_PRIVATE_KEY');
    
    if (!privateKeyValue) {
      this.logger.warn('BLOCKCHAIN_PRIVATE_KEY not found. Using development mode with limited functionality.');
      // Provide a dummy key for development (won't work for actual transactions)
      this.privateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';
    } else {
      this.privateKey = privateKeyValue;
    }
    
    // Initialize blockchain clients
    try {
      this.account = privateKeyToAccount(this.privateKey as `0x${string}`);
      
      const rpcUrl = this.configService.get<string>('BLOCKCHAIN_RPC_URL') || 'https://ethereum-sepolia.publicnode.com';
      
      this.walletClient = createWalletClient({
        account: this.account,
        chain: sepolia,
        transport: http(rpcUrl),
      });
      
      this.publicClient = createPublicClient({
        chain: sepolia,
        transport: http(rpcUrl),
      });
      
      this.logger.log('Blockchain service initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize blockchain service: ${error.message}`);
      // Allow service to initialize but with limited functionality
    }
  }

  // Update the method signature
  async storeDataOnChain(data: any): Promise<string | null> {
    try {
      // Create a hash of the data to be stored
      const dataString = JSON.stringify(data);
      
      // Store the data hash on the blockchain
      const hash = await this.walletClient.sendTransaction({
        to: '0x0000000000000000000000000000000000000000', // Example address
        value: 0n,
        data: `0x${Buffer.from(dataString).toString('hex')}`,
      });
      
      this.logger.log(`Data stored on blockchain with transaction hash: ${hash}`);
      return hash;
    } catch (error) {
      this.logger.error(`Failed to store data on blockchain: ${error.message}`);
      // Return a null hash in case of failure
      return null;
    }
  }

  async verifyDataOnChain(hash: string, data: any): Promise<boolean> {
    try {
      const transaction = await this.publicClient.getTransaction({
        hash: hash as `0x${string}`,
      });
      
      if (!transaction) {
        return false;
      }
      
      // Verify that the transaction data matches the expected data
      const dataString = JSON.stringify(data);
      const expectedData = `0x${Buffer.from(dataString).toString('hex')}`;
      
      return transaction.input === expectedData;
    } catch (error) {
      this.logger.error(`Failed to verify data on blockchain: ${error.message}`);
      return false;
    }
  }

  /**
   * Verify a signature against a message and user ID
   */
  async verifySignature(
    message: string,
    signature: string,
    patientId: string
  ): Promise<boolean> {
    try {
      // Get the patient's wallet address from the database
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true }
      });

      if (!patient?.user?.walletAddress) {
        return false;
      }

      // Recover the address that signed the message
      const recoveredAddress = ethers.verifyMessage(message, signature);
      
      // Compare with the patient's wallet address (case-insensitive)
      return recoveredAddress.toLowerCase() === patient.user.walletAddress.toLowerCase();
    } catch (error) {
      console.error('Error verifying signature:', error);
      return false;
    }
  }
}