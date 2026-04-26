import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { Card, CardContent, Button } from '../components/ui';
import { supabase } from '../lib/supabase';
import {
  Camera, Upload, X, Image, Download, Trash2, Eye,
  MapPin, Clock, ChevronLeft, ChevronRight, AlertCircle,
  CheckCircle2, Loader2, BarChart3, FolderOpen, User,
} from 'lucide-react';

interface Chantier {
  id: string;
  nom: string;
  ville: string;
  statut: string;
}

type Categorie = 'avancement' | 'avant' | 'apres' | 'probleme' | 'reception' | 'autre';

interface Photo {
  id: string;
  user_id: string;
  chantier_id: string;
  url: string;
  nom_fichier: string;
  description: string;
  categorie: Categorie;
  prise_par: string;
  created_at: string;
}

interface PendingFile {
  file: File;
  preview: string;
  description: string;
  categorie: Categorie;
  prise_par: string;
}

const CAT_CONFIG: Record<Categorie, { label: string; color: string; bg: string }> = {
  avancement: { label: 'Avancement',  color: 'text-blue-700',   bg: 'bg-blue-100' },
  avant:      { label: 'Avant',       color: 'text-slate-700',  bg: 'bg-slate-100' },
  apres:      { label: 'Après',       color: 'text-green-700',  bg: 'bg-green-100' },
  probleme:   { label: 'Problème',    color: 'text-red-700',    bg: 'bg-red-100' },
  reception:  { label: 'Réception',   color: 'text-purple-700', bg: 'bg-purple-100' },
  autre:      { label: 'Autre',       color: 'text-amber-700',  bg: 'bg-amber-100' },
};

const CAT_TABS: { value: 'all' | Categorie; label: string }[] = [
  { value: 'all',        label: 'Tout' },
  { value: 'avancement', label: 'Avancement' },
  { value: 'avant',      label: 'Avant' },
  { value: 'apres',      label: 'Après' },
  { value: 'probleme',   label: 'Problème' },
  { value: 'reception',  label: 'Réception' },
  { value: 'autre',      label: 'Autre' },
];

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Galerie() {
  const { user } = useAuth();

  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [selectedChantier, setSelectedChantier] = useState<string>('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [catFilter, setCatFilter] = useState<'all' | Categorie>('all');
  const [loading, setLoading] = useState(false);
  const [storageError, setStorageError] = useState('');

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadIdx, setUploadIdx] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadChantiers = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chantiers')
      .select('id, nom, ville, statut')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setChantiers(data || []);
    if (data && data.length > 0 && !selectedChantier) {
      setSelectedChantier(data[0].id);
    }
  }, [user, selectedChantier]);

  const loadPhotos = useCallback(async () => {
    if (!user || !selectedChantier) { setPhotos([]); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('photos_chantier')
      .select('*')
      .eq('user_id', user.id)
      .eq('chantier_id', selectedChantier)
      .order('created_at', { ascending: false });
    if (error) {
      setStorageError('Impossible de charger les photos : ' + error.message);
    } else {
      setStorageError('');
      setPhotos(data || []);
    }
    setLoading(false);
  }, [user, selectedChantier]);

  useEffect(() => { loadChantiers(); }, [user]);
  useEffect(() => { loadPhotos(); }, [selectedChantier, user]);

  const filtered = catFilter === 'all' ? photos : photos.filter(p => p.categorie === catFilter);

  const catCounts: Partial<Record<Categorie, number>> = {};
  photos.forEach(p => { catCounts[p.categorie] = (catCounts[p.categorie] || 0) + 1; });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const pending: PendingFile[] = files.map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
      description: '',
      categorie: 'avancement',
      prise_par: '',
    }));
    setPendingFiles(pending);
    setUploadIdx(0);
    setUploadDone(false);
    setUploadError('');
    setShowUploadModal(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updatePending = (idx: number, patch: Partial<PendingFile>) => {
    setPendingFiles(prev => prev.map((f, i) => i === idx ? { ...f, ...patch } : f));
  };

  const handleUploadAll = async () => {
    if (!user || !selectedChantier) return;
    setUploading(true);
    setUploadError('');
    let done = 0;

    for (const pf of pendingFiles) {
      const path = `${user.id}/${selectedChantier}/${Date.now()}_${pf.file.name}`;
      const { error: upErr } = await supabase.storage
        .from('photos-chantier')
        .upload(path, pf.file, { upsert: false });

      if (upErr) {
        setUploadError(
          upErr.message.includes('Bucket not found') || upErr.message.includes('bucket')
            ? 'Le bucket de stockage "photos-chantier" n\'existe pas ou n\'est pas accessible. Vérifiez la configuration Supabase Storage.'
            : `Erreur lors de l'upload de "${pf.file.name}" : ${upErr.message}`
        );
        setUploading(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from('photos-chantier')
        .getPublicUrl(path);

      const { error: dbErr } = await supabase.from('photos_chantier').insert({
        user_id: user.id,
        chantier_id: selectedChantier,
        url: publicData.publicUrl,
        nom_fichier: pf.file.name,
        description: pf.description,
        categorie: pf.categorie,
        prise_par: pf.prise_par,
      });

      if (dbErr) {
        setUploadError(`Erreur base de données pour "${pf.file.name}" : ${dbErr.message}`);
        setUploading(false);
        return;
      }

      done++;
      setUploadProgress(Math.round((done / pendingFiles.length) * 100));
    }

    setUploading(false);
    setUploadDone(true);
    pendingFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
    await loadPhotos();
  };

  const closeUploadModal = () => {
    if (!uploading) {
      pendingFiles.forEach(pf => URL.revokeObjectURL(pf.preview));
      setPendingFiles([]);
      setShowUploadModal(false);
      setUploadProgress(0);
      setUploadDone(false);
      setUploadError('');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const photo = photos.find(p => p.id === deleteId);
    if (photo) {
      const urlParts = photo.url.split('/photos-chantier/');
      if (urlParts.length > 1) {
        await supabase.storage.from('photos-chantier').remove([urlParts[1]]);
      }
    }
    await supabase.from('photos_chantier').delete().eq('id', deleteId);
    setDeleting(false);
    setDeleteId(null);
    if (lightboxIdx !== null) {
      setLightboxIdx(null);
    }
    await loadPhotos();
  };

  const lightboxPhotos = filtered;
  const lightboxPhoto = lightboxIdx !== null ? lightboxPhotos[lightboxIdx] : null;

  const lightboxPrev = () => {
    if (lightboxIdx === null) return;
    setLightboxIdx(lightboxIdx > 0 ? lightboxIdx - 1 : lightboxPhotos.length - 1);
  };
  const lightboxNext = () => {
    if (lightboxIdx === null) return;
    setLightboxIdx(lightboxIdx < lightboxPhotos.length - 1 ? lightboxIdx + 1 : 0);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lightboxIdx === null) return;
      if (e.key === 'ArrowLeft') lightboxPrev();
      if (e.key === 'ArrowRight') lightboxNext();
      if (e.key === 'Escape') setLightboxIdx(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, lightboxPhotos.length]);

  const selectedChantierData = chantiers.find(c => c.id === selectedChantier);

  return (
    <AppLayout title="Galerie photos" description="Photos et suivi visuel par chantier">
      <div className="space-y-6">

        {/* Header controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-slate-100 flex-shrink-0">
              <Camera className="w-5 h-5 text-slate-600" />
            </div>
            <div className="min-w-0">
              <select
                value={selectedChantier}
                onChange={e => { setSelectedChantier(e.target.value); setCatFilter('all'); }}
                className="text-base font-semibold text-slate-900 bg-transparent border-0 focus:outline-none focus:ring-0 cursor-pointer pr-6 max-w-xs truncate"
              >
                {chantiers.length === 0 && <option value="">Aucun chantier</option>}
                {chantiers.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}{c.ville ? ` — ${c.ville}` : ''}</option>
                ))}
              </select>
              {selectedChantierData && (
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {selectedChantierData.ville || 'Ville non renseignée'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedChantier}
            >
              <Upload className="w-4 h-4 mr-2" />
              Ajouter des photos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Stats */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-slate-50 border-slate-200">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200">
                  <Image className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{photos.length}</p>
                  <p className="text-xs text-slate-500">Total photos</p>
                </div>
              </CardContent>
            </Card>
            {Object.entries(catCounts).slice(0, 3).map(([cat, count]) => {
              const cfg = CAT_CONFIG[cat as Categorie];
              return (
                <Card key={cat} className="border-slate-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${cfg.bg}`}>
                      <BarChart3 className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${cfg.color}`}>{count}</p>
                      <p className="text-xs text-slate-500">{cfg.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Error storage */}
        {storageError && (
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-700">Erreur de chargement</p>
              <p className="text-sm text-red-600 mt-0.5">{storageError}</p>
            </div>
          </div>
        )}

        {/* Category tabs */}
        {selectedChantier && (
          <div className="flex flex-wrap gap-2">
            {CAT_TABS.map(tab => {
              const count = tab.value === 'all' ? photos.length : (catCounts[tab.value as Categorie] || 0);
              const active = catFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setCatFilter(tab.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-1.5 text-xs ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Photo grid */}
        {loading ? (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="aspect-square rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : !selectedChantier ? (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">Sélectionnez un chantier pour voir ses photos</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Camera className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">
              {catFilter === 'all'
                ? 'Aucune photo pour ce chantier'
                : `Aucune photo dans la catégorie "${CAT_CONFIG[catFilter as Categorie]?.label}"`}
            </p>
            {catFilter === 'all' && (
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Ajouter des photos
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((photo, idx) => {
              const cfg = CAT_CONFIG[photo.categorie];
              return (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => setLightboxIdx(idx)}
                >
                  <img
                    src={photo.url}
                    alt={photo.nom_fichier}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>

                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteId(photo.id); }}
                      className="p-1.5 rounded-lg bg-white/90 text-red-500 hover:bg-white hover:text-red-700 transition-colors shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between text-white text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(photo.created_at)}
                      </span>
                      {photo.prise_par && (
                        <span className="flex items-center gap-1 truncate ml-2">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{photo.prise_par}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setLightboxIdx(null)}
        >
          <div className="relative w-full h-full flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>

            {/* Close */}
            <button
              onClick={() => setLightboxIdx(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Prev */}
            {lightboxPhotos.length > 1 && (
              <button
                onClick={lightboxPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next */}
            {lightboxPhotos.length > 1 && (
              <button
                onClick={lightboxNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div className="flex flex-col lg:flex-row items-center gap-6 max-w-6xl w-full max-h-full">
              <div className="flex-1 min-w-0 flex items-center justify-center">
                <img
                  src={lightboxPhoto.url}
                  alt={lightboxPhoto.nom_fichier}
                  className="max-h-[70vh] max-w-full rounded-xl object-contain shadow-2xl"
                />
              </div>

              <div className="w-full lg:w-72 flex-shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-5 text-white space-y-4">
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${CAT_CONFIG[lightboxPhoto.categorie].bg} ${CAT_CONFIG[lightboxPhoto.categorie].color}`}>
                    {CAT_CONFIG[lightboxPhoto.categorie].label}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-white/60 mb-1">Fichier</p>
                  <p className="text-sm font-medium truncate">{lightboxPhoto.nom_fichier}</p>
                </div>

                {lightboxPhoto.description && (
                  <div>
                    <p className="text-xs text-white/60 mb-1">Description</p>
                    <p className="text-sm text-white/90 leading-relaxed">{lightboxPhoto.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-white/60 mb-1">Date</p>
                  <p className="text-sm flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-white/50" />
                    {formatDate(lightboxPhoto.created_at)}
                  </p>
                </div>

                {lightboxPhoto.prise_par && (
                  <div>
                    <p className="text-xs text-white/60 mb-1">Prise par</p>
                    <p className="text-sm flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-white/50" />
                      {lightboxPhoto.prise_par}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                  <a
                    href={lightboxPhoto.url}
                    download={lightboxPhoto.nom_fichier}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
                    onClick={e => e.stopPropagation()}
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </a>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteId(lightboxPhoto.id); setLightboxIdx(null); }}
                    className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {lightboxPhotos.length > 1 && (
                  <p className="text-center text-xs text-white/40">
                    {(lightboxIdx ?? 0) + 1} / {lightboxPhotos.length}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUploadModal && pendingFiles.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Ajouter des photos</h2>
                <p className="text-xs text-slate-500 mt-0.5">{pendingFiles.length} fichier{pendingFiles.length > 1 ? 's' : ''} sélectionné{pendingFiles.length > 1 ? 's' : ''}</p>
              </div>
              {!uploading && (
                <button onClick={closeUploadModal} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              )}
            </div>

            <div className="p-6 space-y-6">
              {uploadDone ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="p-3 rounded-full bg-green-100">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-lg font-semibold text-slate-900">Photos ajoutées avec succès</p>
                  <p className="text-sm text-slate-500">{pendingFiles.length} photo{pendingFiles.length > 1 ? 's' : ''} ajoutée{pendingFiles.length > 1 ? 's' : ''} à la galerie.</p>
                  <Button onClick={closeUploadModal}>Fermer</Button>
                </div>
              ) : uploading ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Loader2 className="w-10 h-10 text-slate-500 animate-spin" />
                  <p className="text-slate-700 font-medium">Upload en cours...</p>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className="bg-slate-900 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-slate-500">{uploadProgress}%</p>
                </div>
              ) : (
                <>
                  {uploadError && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-700 text-sm">Erreur d'upload</p>
                        <p className="text-sm text-red-600 mt-0.5">{uploadError}</p>
                      </div>
                    </div>
                  )}

                  {/* Tabs if multiple files */}
                  {pendingFiles.length > 1 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {pendingFiles.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setUploadIdx(i)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            uploadIdx === i
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Photo {i + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Current file form */}
                  {(() => {
                    const pf = pendingFiles[uploadIdx];
                    return (
                      <div className="space-y-4">
                        <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video">
                          <img
                            src={pf.preview}
                            alt={pf.file.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-xs text-white bg-black/50 rounded-lg px-2 py-1 truncate">{pf.file.name}</p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Catégorie</label>
                          <select
                            value={pf.categorie}
                            onChange={e => updatePending(uploadIdx, { categorie: e.target.value as Categorie })}
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white"
                          >
                            {Object.entries(CAT_CONFIG).map(([val, cfg]) => (
                              <option key={val} value={val}>{cfg.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Prise par</label>
                          <input
                            type="text"
                            value={pf.prise_par}
                            onChange={e => updatePending(uploadIdx, { prise_par: e.target.value })}
                            placeholder="Nom du photographe..."
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(optionnel)</span></label>
                          <textarea
                            value={pf.description}
                            onChange={e => updatePending(uploadIdx, { description: e.target.value })}
                            rows={3}
                            placeholder="Description de la photo, contexte..."
                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none"
                          />
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {!uploading && !uploadDone && (
              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
                <Button variant="outline" onClick={closeUploadModal}>Annuler</Button>
                <Button onClick={handleUploadAll}>
                  <Upload className="w-4 h-4 mr-2" />
                  Uploader {pendingFiles.length > 1 ? `${pendingFiles.length} photos` : 'la photo'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Supprimer cette photo ?</h2>
            <p className="text-sm text-slate-500 mb-6">Cette action est irréversible. La photo sera supprimée du stockage et de la base de données.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>Annuler</Button>
              <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                {deleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
