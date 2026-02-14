function toCsvRow(row) {
  return row
    .map(value => `"${String(value ?? "").replace(/"/g, "\"\"")}"`)
    .join(",");
}

function downloadCsv(filename, headers, rows) {
  const csv = [headers, ...rows].map(toCsvRow).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

async function exportAsetData(filter = {}) {
  const aset = await getAll("aset");
  const lokasi = await getAll("lokasi");
  const filtered = aset.filter(item => {
    const matchLokasi = !filter.lokasiId || item.lokasiId === filter.lokasiId;
    const matchKategori = !filter.kategori || item.kategori === filter.kategori;
    const matchKondisi = !filter.kondisi || item.kondisi === filter.kondisi;
    return matchLokasi && matchKategori && matchKondisi;
  });

  const rows = filtered.map(item => {
    const lokasiNama = lokasi.find(loc => loc.id === item.lokasiId)?.nama || "-";
    return [
      item.nama,
      lokasiNama,
      item.kategori,
      item.kondisi,
      item.jumlah,
      item.tahun
    ];
  });

  downloadCsv(
    "aset-sarpras.csv",
    ["Nama", "Lokasi", "Kategori", "Kondisi", "Jumlah", "Tahun"],
    rows
  );
}

async function exportLokasiData() {
  const lokasi = await getAll("lokasi");
  const rows = lokasi.map(item => [item.nama, item.tipe, item.catatan || "-"]);
  downloadCsv("lokasi-sarpras.csv", ["Nama", "Kategori", "Catatan"], rows);
}

async function exportPemeliharaanData() {
  const aset = await getAll("aset");
  const lokasi = await getAll("lokasi");
  const pemeliharaan = await getAll("pemeliharaan");
  const rows = pemeliharaan.map(item => {
    const asetData = aset.find(data => data.id === item.asetId);
    const lokasiData = lokasi.find(loc => loc.id === asetData?.lokasiId);
    return [
      formatDate(item.tanggal),
      asetData?.nama || "-",
      lokasiData?.nama || "-",
      item.catatan || "-"
    ];
  });
  downloadCsv(
    "pemeliharaan-sarpras.csv",
    ["Tanggal", "Aset", "Lokasi", "Catatan"],
    rows
  );
}

async function exportMutasiData() {
  const aset = await getAll("aset");
  const lokasi = await getAll("lokasi");
  const mutasi = await getAll("mutasi");
  const rows = mutasi.map(item => {
    const asetData = aset.find(data => data.id === item.asetId);
    const dari = lokasi.find(loc => loc.id === item.dariLokasiId);
    const ke = lokasi.find(loc => loc.id === item.keLokasiId);
    return [
      formatDate(item.tanggal),
      asetData?.nama || "-",
      dari?.nama || "-",
      ke?.nama || "-",
      item.penanggungJawab
    ];
  });
  downloadCsv(
    "mutasi-sarpras.csv",
    ["Tanggal", "Aset", "Dari", "Ke", "Penanggung Jawab"],
    rows
  );
}
