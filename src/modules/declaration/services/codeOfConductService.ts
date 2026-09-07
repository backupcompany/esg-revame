import { CodeOfConductDeclaration } from '../types';
import { apiGet, apiPost, publicGet } from '../../../core/services/api';

export interface CoCClause {
  id: string;
  titleId: string;
  titleEn: string;
  bodyId: string;
  bodyEn: string;
}

export interface CoCVersion {
  version: string;
  titleId: string;
  titleEn: string;
  clauses: CoCClause[];
}

export const codeOfConductService = {
  getCurrentVersion: async (): Promise<CoCVersion | null> => {
    const authed = await apiGet<CoCVersion>('/api/coc');
    if (authed?.version) return authed;
    return publicGet<CoCVersion>('/api/public/coc');
  },

  getDeclarations: async (): Promise<CodeOfConductDeclaration[]> => {
    const data = await apiGet<{ declarations: CodeOfConductDeclaration[] }>(
      '/api/coc/declarations?limit=50'
    );
    return data?.declarations ?? [];
  },

  getLatestDeclarationForVendor: async (_vendorId?: string): Promise<CodeOfConductDeclaration | null> => {
    const data = await apiGet<{ latest: CodeOfConductDeclaration | null }>(
      '/api/coc/declarations?limit=1'
    );
    return data?.latest ?? null;
  },

  saveDeclaration: async (decl: {
    signerName: string;
    signerTitle: string;
    signerAddress: string;
    signatureConfirmed: boolean;
  }): Promise<CodeOfConductDeclaration> => {
    const data = await apiPost<{ declaration: CodeOfConductDeclaration }>('/api/coc/sign', {
      signerName: decl.signerName,
      signerTitle: decl.signerTitle,
      signerAddress: decl.signerAddress,
      signatureConfirmed: decl.signatureConfirmed
    });
    if (!data?.declaration) {
      throw new Error('Gagal menandatangani Kode Etik. Pastikan akun terhubung ke vendor.');
    }
    return data.declaration;
  }
};
