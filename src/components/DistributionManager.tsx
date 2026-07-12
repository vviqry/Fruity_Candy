import React, { useState } from 'react';
import { DistributionItem } from '../types';
import { MapPin, Plus, Trash2, Calendar, Map, AlertCircle, ShoppingBag, Layers, Check } from 'lucide-react';

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
  const [selectedJarType, setSelectedJarType] = useState('Manco Crunch');
  const [customJarType, setCustomJarType] = useState('');
  const [mapEmbedCode, setMapEmbedCode] = useState('');
  const [entryDate, setEntryDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [error, setError] = useState('');

  // Track selected dates for the history dropdowns of each location row
  const [selectedDates, setSelectedDates] = useState<Record<string, string>>({});

  // Predefined types for suggestions
  const jarTypes = ['Manco Crunch', 'Fruity Candy'];

  // Calculate if typed location name is an existing location (case-insensitive)
  const matchedLocation = items.find(
    (item) => item.locationName.toLowerCase().trim() === locationName.toLowerCase().trim()
  );
  const isExistingLocation = !!matchedLocation;

  // Stats calculation
  const totalLocations = items.length;
  // totalJars is the sum of ALL quantities across ALL delivery records of ALL locations
  const totalJars = items.reduce(
    (acc, item) => acc + (item.deliveries || []).reduce((sum, d) => sum + (d?.jarQuantity || 0), 0),
    0
  );

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
    
    const finalJarType = selectedJarType === 'Custom' ? customJarType.trim() : selectedJarType;
    if (!finalJarType) {
      setError('Jenis tidak boleh kosong');
      return;
    }

    // For existing location, the map is permanent and does not need to be validated or re-entered
    const finalMapEmbedCode = isExistingLocation ? matchedLocation.mapEmbedCode : mapEmbedCode.trim();

    if (!isExistingLocation && (!finalMapEmbedCode || !finalMapEmbedCode.includes('<iframe'))) {
      setError('Kode embed Google Maps (<iframe>) tidak valid untuk lokasi baru ini');
      return;
    }
    if (!entryDate) {
      setError('Tanggal distribusi harus diisi');
      return;
    }

    onAddDistribution({
      locationName: locationName.trim(),
      jarQuantity: Number(jarQuantity),
      jarType: finalJarType,
      mapEmbedCode: finalMapEmbedCode,
      entryDate,
    });

    // Reset Form
    setLocationName('');
    setJarQuantity('');
    setSelectedJarType('Manco Crunch');
    setCustomJarType('');
    setMapEmbedCode('');
    setError('');
  };

  // Get matching locations as user types (autocomplete suggestions)
  const suggestions = locationName.trim()
    ? items.filter(
        (item) =>
          item.locationName.toLowerCase().includes(locationName.toLowerCase()) &&
          item.locationName.toLowerCase().trim() !== locationName.toLowerCase().trim()
      )
    : [];

  // Extract maps preview url securely
  const getIframeSrc = (iframeStr: string) => {
    const match = iframeStr?.match(/src="([^"]+)"/);
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

            <div className="relative">
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

              {/* Autocomplete Suggestions */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                  <div className="p-2 text-[10px] font-bold text-slate-400 bg-slate-50 uppercase tracking-wider">Pilih Lokasi Terdaftar:</div>
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setLocationName(item.locationName);
                        setMapEmbedCode(item.mapEmbedCode);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition flex items-center space-x-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-semibold">{item.locationName}</span>
                    </button>
                  ))}
                </div>
              )}

              {isExistingLocation && (
                <div className="mt-1.5 flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50/50 border border-emerald-100 px-2 py-1 rounded-lg">
                  <Check className="w-3.5 h-3.5" />
                  <span>Lokasi Terdaftar: Kode Google Maps otomatis disesuaikan.</span>
                </div>
              )}
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
                  Jenis
                </label>
                <div className="relative">
                  <select
                    id="jarType"
                    value={selectedJarType}
                    onChange={(e) => setSelectedJarType(e.target.value)}
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

            {selectedJarType === 'Custom' && (
              <div>
                <label htmlFor="customJarType" className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Tulis Jenis Kustom
                </label>
                <input
                  id="customJarType"
                  type="text"
                  value={customJarType}
                  placeholder="Contoh: Toples Melamin Premium"
                  onChange={(e) => setCustomJarType(e.target.value)}
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
                value={isExistingLocation ? matchedLocation.mapEmbedCode : mapEmbedCode}
                onChange={(e) => setMapEmbedCode(e.target.value)}
                disabled={isExistingLocation}
                placeholder={isExistingLocation ? 'Kode google maps terkunci untuk lokasi terdaftar ini.' : 'Contoh: <iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>'}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm font-mono text-xs focus:outline-none transition ${
                  isExistingLocation
                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:bg-white'
                }`}
              />
              {!isExistingLocation && (
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Salin dari Google Maps: Bagikan &rarr; Sematkan Peta &rarr; Salin HTML.
                </p>
              )}
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
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs">Jumlah Toples & Jenis</th>
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs">Riwayat Distribusi (History)</th>
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs">Preview Peta</th>
                    <th className="p-4 font-semibold text-slate-600 uppercase tracking-wider text-xs text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const deliveries = item.deliveries || [];
                    const currentSelectedDate = selectedDates[item.id] || (deliveries[0]?.date || '');
                    const activeDelivery = deliveries.find(d => d.date === currentSelectedDate) || deliveries[0];

                    return (
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
                          {activeDelivery ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{activeDelivery.jarQuantity} Pcs</span>
                              <span className="text-xs text-slate-500">{activeDelivery.jarType}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>

                        {/* History Date Dropdown */}
                        <td className="p-4">
                          {deliveries.length > 0 ? (
                            <div className="relative max-w-[160px]">
                              <select
                                className="w-full pl-2.5 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                value={currentSelectedDate}
                                onChange={(e) => {
                                  const newDate = e.target.value;
                                  setSelectedDates(prev => ({ ...prev, [item.id]: newDate }));
                                }}
                                title="Riwayat tanggal distribusi"
                              >
                                {deliveries.map((delivery, idx) => (
                                  <option key={`${delivery.date}-${idx}`} value={delivery.date}>
                                    {delivery.date} {idx === 0 ? '(Terbaru)' : ''}
                                  </option>
                                ))}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                                <Calendar className="w-3 h-3" />
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Belum ada riwayat</span>
                          )}
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
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
