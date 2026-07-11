import React, { useState, useEffect } from 'react';
import { SupplyItem, DistributionItem, SyncData } from '../types';
import { googleSignIn, googleSignOut, initAuth, getAccessToken } from '../firebase';
import { User } from 'firebase/auth';
import { Database, FileText, Check, Copy, Upload, Download, LogIn, LogOut, RefreshCw, AlertCircle, Sparkles, Plus } from 'lucide-react';

interface SyncPanelProps {
  supplyItems: SupplyItem[];
  distributionItems: DistributionItem[];
  onImportData: (data: SyncData) => void;
}

export default function SyncPanel({ supplyItems, distributionItems, onImportData }: SyncPanelProps) {
  // Local JSON state
  const [jsonString, setJsonString] = useState('');
  const [importString, setImportString] = useState('');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);

  // Google Sheets integration state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [spreadsheetId, setSpreadsheetId] = useState(() => {
    return localStorage.getItem('pwa_logistik_spreadsheet_id') || '';
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  // Generate current JSON string on load/change
  useEffect(() => {
    const data: SyncData = {
      supply: supplyItems,
      distribution: distributionItems,
    };
    setJsonString(JSON.stringify(data, null, 2));
  }, [supplyItems, distributionItems]);

  // Auth initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Gagal menyalin:', err);
    }
  };

  const handleImportJSON = () => {
    setImportError('');
    setImportSuccess(false);
    if (!importString.trim()) {
      setImportError('Silakan masukkan teks kode unik JSON');
      return;
    }

    try {
      const parsed = JSON.parse(importString) as Partial<SyncData>;
      
      // Validation check
      if (!parsed.supply || !Array.isArray(parsed.supply)) {
        setImportError('Data supply tidak valid atau kosong');
        return;
      }
      if (!parsed.distribution || !Array.isArray(parsed.distribution)) {
        setImportError('Data distribusi tidak valid atau kosong');
        return;
      }

      // Prompt to double check
      const confirmed = window.confirm('Apakah Anda yakin ingin menimpa data lokal dengan data impor ini? Tindakan ini tidak bisa dibatalkan.');
      if (!confirmed) return;

      onImportData({
        supply: parsed.supply as SupplyItem[],
        distribution: parsed.distribution as DistributionItem[],
      });

      setImportSuccess(true);
      setImportString('');
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err: any) {
      setImportError(`Gagal parsing JSON: ${err.message}`);
    }
  };

  const handleGoogleSignIn = async () => {
    setSyncStatus('loading');
    setSyncMessage('Menghubungkan ke Google...');
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
        setSyncStatus('idle');
        setSyncMessage('');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setSyncStatus('error');
      setSyncMessage(`Login Gagal: ${err.message}`);
    }
  };

  const handleGoogleSignOut = async () => {
    await googleSignOut();
    setUser(null);
    setAccessToken(null);
    setNeedsAuth(true);
    setSyncStatus('idle');
    setSyncMessage('');
  };

  // Safe fetch helper for sheets API
  const sheetsFetch = async (url: string, options: RequestInit = {}) => {
    let token = accessToken;
    if (!token) {
      token = await getAccessToken();
    }
    if (!token) {
      throw new Error('Sesi Google kadaluarsa. Silakan login kembali.');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `HTTP error ${res.status}`);
    }
    return res.json();
  };

  // Create a brand new spreadsheet
  const handleCreateSpreadsheet = async () => {
    setSyncStatus('loading');
    setSyncMessage('Membuat Spreadsheet Baru di Google Drive...');
    try {
      const payload = {
        properties: {
          title: 'PWA Logistik Personal Database',
        },
        sheets: [
          { properties: { title: 'Supply' } },
          { properties: { title: 'Distribution' } },
        ],
      };

      const data = await sheetsFetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (data.spreadsheetId) {
        setSpreadsheetId(data.spreadsheetId);
        localStorage.setItem('pwa_logistik_spreadsheet_id', data.spreadsheetId);
        setSyncStatus('success');
        setSyncMessage('Berhasil membuat spreadsheet baru!');
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncMessage(`Gagal membuat spreadsheet: ${err.message}`);
    }
  };

  // Export current local database to Google Sheets
  const handleExportToSheets = async () => {
    if (!spreadsheetId.trim()) {
      setSyncStatus('error');
      setSyncMessage('Silakan masukkan Spreadsheet ID atau buat Spreadsheet baru.');
      return;
    }

    setSyncStatus('loading');
    setSyncMessage('Mengekspor data ke Google Sheets...');
    try {
      // 1. First, clear old values
      await sheetsFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Supply!A:Z:clear`, { method: 'POST' });
      await sheetsFetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Distribution!A:Z:clear`, { method: 'POST' });

      // 2. Format Supply Rows
      const supplyValues = [
        ['ID', 'Nama Produk', 'Kategori Status', 'Harga Satuan', 'Tanggal Masuk'],
        ...supplyItems.map(item => [item.id, item.productName, item.category, item.price, item.entryDate])
      ];

      // 3. Format Distribution Rows
      // To preserve history dates correctly, we can join them with commas
      const distributionValues = [
        ['ID', 'Nama Lokasi', 'Jumlah Toples', 'Jenis Toples', 'Embed Google Maps', 'Riwayat Tanggal (History)'],
        ...distributionItems.map(item => [
          item.id,
          item.locationName,
          item.jarQuantity,
          item.jarType,
          item.mapEmbedCode,
          item.historyDates.join(', ')
        ])
      ];

      // 4. Put Supply
      await sheetsFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Supply!A1?valueInputOption=RAW`,
        {
          method: 'PUT',
          body: JSON.stringify({
            range: 'Supply!A1',
            majorDimension: 'ROWS',
            values: supplyValues,
          }),
        }
      );

      // 5. Put Distribution
      await sheetsFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Distribution!A1?valueInputOption=RAW`,
        {
          method: 'PUT',
          body: JSON.stringify({
            range: 'Distribution!A1',
            majorDimension: 'ROWS',
            values: distributionValues,
          }),
        }
      );

      setSyncStatus('success');
      setSyncMessage('Berhasil mengekspor semua data ke Google Sheets!');
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncMessage(`Gagal ekspor: ${err.message}`);
    }
  };

  // Import from Google Sheets
  const handleImportFromSheets = async () => {
    if (!spreadsheetId.trim()) {
      setSyncStatus('error');
      setSyncMessage('Silakan masukkan Spreadsheet ID.');
      return;
    }

    const confirmed = window.confirm('Apakah Anda yakin ingin mengimpor data dari Google Sheets dan menimpa data lokal saat ini?');
    if (!confirmed) return;

    setSyncStatus('loading');
    setSyncMessage('Mengunduh data dari Google Sheets...');
    try {
      // 1. Fetch Supply Values
      const supplyData = await sheetsFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Supply!A:E`
      );

      // 2. Fetch Distribution Values
      const distributionData = await sheetsFetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Distribution!A:F`
      );

      // Parse Supply
      const importedSupply: SupplyItem[] = [];
      if (supplyData.values && supplyData.values.length > 1) {
        // Skip header row
        for (let i = 1; i < supplyData.values.length; i++) {
          const row = supplyData.values[i];
          if (row[0] && row[1]) {
            importedSupply.push({
              id: row[0],
              productName: row[1],
              category: (row[2] || '🟢') as '🔴' | '🟡' | '🟢',
              price: Number(row[3] || 0),
              entryDate: row[4] || '',
            });
          }
        }
      }

      // Parse Distribution
      const importedDistribution: DistributionItem[] = [];
      if (distributionData.values && distributionData.values.length > 1) {
        for (let i = 1; i < distributionData.values.length; i++) {
          const row = distributionData.values[i];
          if (row[0] && row[1]) {
            // Re-parse comma-separated historyDates
            const historyDates = row[5] ? row[5].split(',').map((d: string) => d.trim()).filter(Boolean) : [];
            importedDistribution.push({
              id: row[0],
              locationName: row[1],
              jarQuantity: Number(row[2] || 0),
              jarType: row[3] || 'Toples Kaca',
              mapEmbedCode: row[4] || '',
              historyDates: historyDates.length > 0 ? historyDates : ['2026-07-11'], // fallback
            });
          }
        }
      }

      // Save and import
      onImportData({
        supply: importedSupply,
        distribution: importedDistribution,
      });

      setSyncStatus('success');
      setSyncMessage(`Sukses mengimpor ${importedSupply.length} supply & ${importedDistribution.length} lokasi distribusi!`);
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncMessage(`Gagal impor: ${err.message}`);
    }
  };

  const handleSaveManualId = (val: string) => {
    setSpreadsheetId(val);
    localStorage.setItem('pwa_logistik_spreadsheet_id', val);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Sheets Sync Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Sinkronisasi Google Sheets</h3>
                <p className="text-xs text-slate-400">Pindahkan data antar-perangkat (PC &harr; HP) secara real-time</p>
              </div>
            </div>

            {needsAuth ? (
              <div className="p-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center justify-center text-center space-y-4">
                <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Hubungkan Akun Google</p>
                  <p className="text-xs text-slate-400 max-w-xs mt-1">
                    Masuk dengan akun Google Anda untuk menyimpan data supply dan distribusi langsung ke spreadsheet Anda.
                  </p>
                </div>
                
                <button
                  onClick={handleGoogleSignIn}
                  className="gsi-material-button inline-flex items-center justify-center space-x-3 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-xs hover:bg-slate-50 active:scale-98 transition text-sm text-slate-700 font-medium"
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* User Info card */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex items-center space-x-3">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || 'Google'} className="w-8 h-8 rounded-full shadow-xs" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
                        {user?.email?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{user?.displayName || 'Logistik User'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleGoogleSignOut}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>

                {/* Spreadsheet ID Input */}
                <div className="space-y-2">
                  <label htmlFor="spreadsheetId" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Google Spreadsheet ID
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="spreadsheetId"
                      type="text"
                      value={spreadsheetId}
                      onChange={(e) => handleSaveManualId(e.target.value)}
                      placeholder="Masukkan ID Spreadsheet yang sudah ada"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleCreateSpreadsheet}
                      className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-semibold text-xs transition flex items-center space-x-1"
                      title="Buat spreadsheet baru"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Baru</span>
                    </button>
                  </div>
                </div>

                {/* Status indicator */}
                {syncStatus !== 'idle' && (
                  <div className={`p-3 rounded-xl border flex items-start space-x-2 text-xs ${
                    syncStatus === 'loading' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                    syncStatus === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                    'bg-red-50 border-red-100 text-red-700'
                  }`}>
                    {syncStatus === 'loading' ? (
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{syncMessage}</span>
                  </div>
                )}

                {/* Export/Import Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    id="btn-export-sheets"
                    onClick={handleExportToSheets}
                    disabled={syncStatus === 'loading'}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ekspor ke Sheets</span>
                  </button>
                  <button
                    id="btn-import-sheets"
                    onClick={handleImportFromSheets}
                    disabled={syncStatus === 'loading'}
                    className="py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-98 disabled:opacity-50 text-white rounded-xl font-semibold text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Impor dari Sheets</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 mt-4 leading-relaxed border-t border-slate-50 pt-3">
            PWA Logistik memanfaatkan API Google Sheets resmi secara client-side, menjaga kerahasiaan data Anda tetap privat.
          </div>
        </div>

        {/* Local Sync (JSON string) Panel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Ekspor & Impor Manual (JSON)</h3>
                <p className="text-xs text-slate-400">Salin dan tempel kode teks unik untuk menyinkronkan data instan</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Copy String Area */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Kode Sinkronisasi Anda</span>
                  <button
                    onClick={handleCopy}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1 font-medium transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kode</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={3}
                  value={jsonString}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono text-slate-500 resize-none focus:outline-none"
                />
              </div>

              {/* Import String Area */}
              <div>
                <label htmlFor="importString" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Tempel Kode Untuk Impor
                </label>
                <textarea
                  id="importString"
                  rows={3}
                  placeholder='Tempel JSON teks unik di sini...'
                  value={importString}
                  onChange={(e) => setImportString(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>

              {importError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-start space-x-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-600 flex items-start space-x-1.5">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Data berhasil diimpor! Halaman akan dimuat ulang otomatis.</span>
                </div>
              )}

              <button
                id="btn-import-json"
                onClick={handleImportJSON}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-semibold text-xs shadow-xs transition flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Verifikasi & Impor Data</span>
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 mt-4 leading-relaxed border-t border-slate-50 pt-3">
            Gunakan metode manual ini jika HP dan PC Anda tidak sedang masuk menggunakan Akun Google Sheets yang sama.
          </div>
        </div>
      </div>
    </div>
  );
}
