/*
  # Tables core BTP - Chantiers, Equipes, Employes, Taches

  ## Nouvelles tables

  ### chantiers
  - id, user_id (proprietaire/entreprise)
  - nom, adresse, ville, code_postal
  - statut: planifie | en_cours | pause | termine | annule
  - date_debut, date_fin_prevue, date_fin_reelle
  - budget_prevu, budget_consomme
  - client_nom, client_contact
  - chef_chantier_nom
  - description, notes
  - avancement (0-100)
  - created_at, updated_at

  ### employes
  - id, user_id (entreprise)
  - nom, prenom, email, telephone
  - corps_metier: macon | charpentier | electricien | plombier | peintre | carreleur | menuisier | conducteur_travaux | chef_chantier | autre
  - statut: disponible | en_chantier | conge | arret
  - chantier_actuel_id (FK chantiers)
  - taux_horaire
  - created_at, updated_at

  ### taches_chantier
  - id, chantier_id (FK), employe_id (FK optionnel)
  - titre, description
  - statut: a_faire | en_cours | bloque | termine
  - priorite: faible | normale | haute | critique
  - date_debut, date_fin_prevue
  - heures_estimees, heures_reelles
  - created_at, updated_at

  ## Securite
  - RLS activee sur toutes les tables
  - Acces restreint au proprietaire (user_id = auth.uid())
*/

CREATE TABLE IF NOT EXISTS chantiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom text NOT NULL DEFAULT '',
  adresse text NOT NULL DEFAULT '',
  ville text NOT NULL DEFAULT '',
  code_postal text NOT NULL DEFAULT '',
  statut text NOT NULL DEFAULT 'planifie' CHECK (statut IN ('planifie','en_cours','pause','termine','annule')),
  date_debut date,
  date_fin_prevue date,
  date_fin_reelle date,
  budget_prevu numeric(12,2) DEFAULT 0,
  budget_consomme numeric(12,2) DEFAULT 0,
  client_nom text NOT NULL DEFAULT '',
  client_contact text NOT NULL DEFAULT '',
  chef_chantier_nom text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  avancement integer NOT NULL DEFAULT 0 CHECK (avancement >= 0 AND avancement <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chantiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own chantiers"
  ON chantiers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chantiers"
  ON chantiers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chantiers"
  ON chantiers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chantiers"
  ON chantiers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_chantiers_user_id ON chantiers(user_id);
CREATE INDEX IF NOT EXISTS idx_chantiers_statut ON chantiers(statut);

CREATE TABLE IF NOT EXISTS employes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom text NOT NULL DEFAULT '',
  prenom text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  telephone text NOT NULL DEFAULT '',
  corps_metier text NOT NULL DEFAULT 'autre' CHECK (corps_metier IN ('macon','charpentier','electricien','plombier','peintre','carreleur','menuisier','conducteur_travaux','chef_chantier','grutier','coffreur','soudeur','autre')),
  statut text NOT NULL DEFAULT 'disponible' CHECK (statut IN ('disponible','en_chantier','conge','arret')),
  chantier_actuel_id uuid REFERENCES chantiers(id) ON DELETE SET NULL,
  taux_horaire numeric(8,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE employes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own employes"
  ON employes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own employes"
  ON employes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own employes"
  ON employes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own employes"
  ON employes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_employes_user_id ON employes(user_id);
CREATE INDEX IF NOT EXISTS idx_employes_statut ON employes(statut);

CREATE TABLE IF NOT EXISTS taches_chantier (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chantier_id uuid NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  employe_id uuid REFERENCES employes(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titre text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  statut text NOT NULL DEFAULT 'a_faire' CHECK (statut IN ('a_faire','en_cours','bloque','termine')),
  priorite text NOT NULL DEFAULT 'normale' CHECK (priorite IN ('faible','normale','haute','critique')),
  date_debut date,
  date_fin_prevue date,
  heures_estimees numeric(6,1) DEFAULT 0,
  heures_reelles numeric(6,1) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE taches_chantier ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own taches"
  ON taches_chantier FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own taches"
  ON taches_chantier FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own taches"
  ON taches_chantier FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own taches"
  ON taches_chantier FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_taches_chantier_id ON taches_chantier(chantier_id);
CREATE INDEX IF NOT EXISTS idx_taches_user_id ON taches_chantier(user_id);
CREATE INDEX IF NOT EXISTS idx_taches_statut ON taches_chantier(statut);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'chantiers_updated_at') THEN
    CREATE TRIGGER chantiers_updated_at BEFORE UPDATE ON chantiers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'employes_updated_at') THEN
    CREATE TRIGGER employes_updated_at BEFORE UPDATE ON employes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'taches_updated_at') THEN
    CREATE TRIGGER taches_updated_at BEFORE UPDATE ON taches_chantier FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
