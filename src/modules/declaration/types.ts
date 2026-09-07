export interface CodeOfConductDeclaration {
  id: string;
  vendorId: string;
  vendorName: string;
  signerName: string;
  signerTitle: string;
  signerAddress: string;
  declaredDate: string;
  validUntil: string;
  status: 'active' | 'expired' | 'pending_renewal';
  signatureConfirmed: boolean;
  version: string;
}
