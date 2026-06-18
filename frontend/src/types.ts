export interface MagasinResume {
  id: number;
  nom: string;
  est_principal: boolean;
}

export interface EntrepriseResume {
  id: number;
  nom: string;
  secteur: string;
  devise: string;
}

export interface UtilisateurCourant {
  id: number;
  nom: string;
  email: string;
  role: string | null;
  permissions: string[];
  entreprise: EntrepriseResume;
  magasin_id: number | null;
  magasins: MagasinResume[];
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
