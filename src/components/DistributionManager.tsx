import React, { useState } from 'react';
import { DistributionItem } from '../types';
import { MapPin, Plus, Trash2, Calendar, Map, AlertCircle, ShoppingBag, Layers } from 'lucide-react';

interface DistributionManagerProps {
  items: DistributionItem[];
  onAddDistribution: (distribution: {
    locationName: string;
    jarQuantity: number;
    jarType: string;
    mapEmbedCode: string;
    entryDate: string;
  }) => void;
  onDeleteDistribution: (id: string) => void;
  onShowMap: (embedCode: string, locationName: string) => void;
}

export default function DistributionManager({
  items,
  onAddDistribution,
  onDeleteDistribution,
  onShowMap,
}: DistributionManagerProps) {
  const [locationName, setLocationName] = useState('');
  const [jarQuantity, setJarQuantity] = useState<number | ''>('');
  const [jarType, setJarType] = useState('Toples Kaca');
  const [mapEmbedCode, setMapEmbedCode] = useState('');
  const [entryDate, setEntryDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [error, setError] = useState('');

  // Predefined jar types for suggestions
  const jarTypes = ['Toples Kaca', 'Toples Plastik', 'Toples Keramik', 'Toples Kristal', 'Toples Aluminium'];

  // Stats calculation
  const totalLocations = items.length;
  const totalJars = items.reduce((acc, item) => acc + item.jarQuantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim()) {
      setError('Nama Lokasi tidak boleh kosong');
      return;
    }
    if (jarQuantity === '' || jarQuantity <= 0) {
      setError('Jumlah toples harus berupa angka lebih besar dari 0');
      return;
    }
    if (!jarType.trim()) {
      setError('Jenis/Tipe toples tidak boleh kosong');
      return;
    }
    if (!mapEmbedCode.trim() || !mapEmbedCode.includes('<iframe')) {
      setError('Kode embed Google Maps (<iframe>) tidak valid');
      return;
    }
    if (!entryDate) {
      setError('Tanggal distribusi harus diisi');
      return;
    }

    onAddDistribution({
      locationName: locationName.trim(),
      jarQuantity: Number(jarQuantity),
      jarType: jarType.trim(),
      mapEmbedCode: mapEmbedCode.trim(),
      entryDate,
    });

    // Reset Form
    setLocationName('');
    setJarQuantity('');
    setMapEmbedCode('');
    setError('');
  };

  // Extract maps preview url securely
  const getIframeSrc = (iframeStr: string) => {
    const match = iframeStr.match(/src="([^"]+)"/);
    return match ? match[1] : '';
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Lokasi</p>
            <h4 className="text-xl font-bold text-slate-800">{totalLocations} Titik Distribusi</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Toples Terdistribusi</p>
            <h4 className="text-xl font-bold text-slate-800">{totalJars} Toples</h4>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center space-x-4 col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Peta Aktif</p>
            <h4 className="text-xl font-bold text-slate-800">
              {items.filter(item => item.mapEmbedCode).length} Lokasi Terpetakan
            </h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit">
          <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center space-x-2">
            <Plus className="w-5 h-5 text-indigo-500" />
            <span>Input Barang Keluar (Distribusi)</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-2 text-xs text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="locationName" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Nama Lokasi / Agen
              </label>
              <input
                id="locationName"
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Contoh: Toko Berkah Abadi, Agen Sleman"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="jarQuantity" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Jumlah Toples
                </label>
                <input
                  id="jarQuantity"
                  type="number"
                  value={jarQuantity}
                  onChange={(e) => setJarQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Contoh: 10"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label htmlFor="jarType" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Jenis/Tipe Toples
                </label>
                <div className="relative">
                  <select
                    id="jarType"
                    value={jarType}
                    onChange={(e) => setJarType(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition appearance-none"
                  >
                    {jarTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="Custom">Custom...</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                  </div>
                </div>
              </div>
            </div>

            {jarType === 'Custom' && (
              <div>
                <label htmlFor="customJarType" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Tulis Jenis Toples Kustom
                </label>
                <input
                  id="customJarType"
                  type="text"
                  placeholder="Contoh: Toples Melamin Premium"
                  onChange={(e) => setJarType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            )}

            <div>
              <label htmlFor="mapEmbedCode" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Kode Embed Google Maps (&lt;iframe&gt;)
              </label>
              <textarea
                id="mapEmbedCode"
                rows={3}
                value={mapEmbedCode}
                onChange={(e) => setMapEmbedCode(e.target.value)}
                placeholder='Contoh: <iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>'
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Salin dari Google Maps: Bagikan &rarr; Sematkan Peta &rarr; Salin HTML.
              </p>
            </div>

            <div>
              <label htmlFor="distEntryDate" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Tanggal Distribusi
              </label>
              <div className="relative">
                <input
                  id="distEntryDate"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              id="btn-add-distribution"
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-500/15 transition flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan ke database</span>
            </button>
          </form>
        </div>

        {/* Table Column */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2 flex flex-col h-[520px]">
          <h3 className="font-bold text-slate-800 text-lg mb-4">
            Tabel Distribusi (Barang Keluar)
          </h3>

          <div className="flex-1 overflow-auto rounded-xl border border-slate-100">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 space-y-2">
                <MapPin className="w-10 h-10 text-slate-300" />
                <p className="text-sm">Belum ada titik distribusi yang dicatat.</p>
                <p className="text-xs text-slate-400">Gunakan form di samping untuk mulai memetakan logistik Anda.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-sm" id="table-distribution-list">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 z-10">
                  <tr>
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs">Nama Lokasi</th>
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs">Toples & Jenis</th>
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs">Riwayat Distribusi (History)</th>
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs">Preview Peta</th>
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      {/* Location Name */}
                      <td className="p-4">
                        <div className="font-semibold text-slate-800 flex items-center space-x-1">
                          <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>{item.locationName}</span>
                        </div>
                      </td>

                      {/* Jar Quantity and Type */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{item.jarQuantity} Pcs</span>
                          <span className="text-xs text-slate-500">{item.jarType}</span>
                        </div>
                      </td>

                      {/* History Date Dropdown */}
                      <td className="p-4">
                        <div className="relative max-w-[160px]">
                          <select
                            className="w-full pl-2.5 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            defaultValue={item.historyDates[0]}
                            title="Riwayat tanggal distribusi"
                          >
                            {item.historyDates.map((date, idx) => (
                              <option key={`${date}-${idx}`} value={date}>
                                {date} {idx === 0 ? '(Terbaru)' : ''}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                            <Calendar className="w-3 h-3" />
                          </div>
                        </div>
                      </td>

                      {/* Interactive Map Preview (Lightbox target) */}
                      <td className="p-4">
                        <div
                          onClick={() => onShowMap(item.mapEmbedCode, item.locationName)}
                          className="relative w-24 h-14 rounded-lg overflow-hidden border border-slate-200 shadow-xs cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
                          title="Klik untuk memperbesar peta"
                        >
                          {/* We extract the URL to put in a non-interactive iframe with pointer-events-none */}
                          <iframe
                            src={getIframeSrc(item.mapEmbedCode)}
                            className="w-full h-full pointer-events-none scale-100 origin-center transition group-hover:scale-105"
                            style={{ border: 0 }}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-indigo-900/10 group-hover:bg-indigo-900/0 transition-all flex items-center justify-center">
                            <div className="bg-white/90 p-1 rounded-full shadow-xs opacity-0 group-hover:opacity-100 transition duration-200">
                              <Map className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action column */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus seluruh data distribusi untuk lokasi "${item.locationName}"?`)) {
                              onDeleteDistribution(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                          title="Hapus lokasi"
                          id={`btn-delete-distribution-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
