window.pageInit = async function () {
  await loadLaporanLokasi();
  document.getElementById("refreshLaporan").addEventListener("click", renderLaporan);
  document.getElementById("exportAset").addEventListener("click", handleExportAset);
  document.getElementById("exportLokasi").addEventListener("click", exportLokasiData);
  document.getElementById("exportPemeliharaan").addEventListener("click", exportPemeliharaanData);
  document.getElementById("exportMutasi").addEventListener("click", exportMutasiData);

  await renderLaporan();
};

async function loadLaporanLokasi() {
  const lokasi = await getAll("lokasi");
  const lokasiSelect = document.getElementById("laporanLokasi");
  lokasiSelect.innerHTML = "";
  lokasiSelect.appendChild(createOption("", "Semua"));
  lokasi.forEach(item => lokasiSelect.appendChild(createOption(item.id, item.nama)));
}

async function renderLaporan() {
  const lokasiId = document.getElementById("laporanLokasi").value;
  const kategori = document.getElementById("laporanKategori").value;
  const kondisi = document.getElementById("laporanKondisi").value;

  const aset = await getAll("aset");
  const lokasi = await getAll("lokasi");

  const filtered = aset.filter(item => {
    const matchLokasi = !lokasiId || item.lokasiId === Number(lokasiId);
    const matchKategori = !kategori || item.kategori === kategori;
    const matchKondisi = !kondisi || item.kondisi === kondisi;
    return matchLokasi && matchKategori && matchKondisi;
  });

  const total = filtered.reduce((sum, item) => sum + Number(item.jumlah || 0), 0);
  const baik = filtered
    .filter(item => item.kondisi === "Baik")
    .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);
  const perlu = total - baik;

  document.getElementById("laporanTotal").textContent = total;
  document.getElementById("laporanBaik").textContent = baik;
  document.getElementById("laporanPerlu").textContent = perlu;

  const table = document.getElementById("laporanTable");
  table.innerHTML = "";

  filtered.forEach(item => {
    const lokasiNama = lokasi.find(loc => loc.id === item.lokasiId)?.nama || "-";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.nama}</td>
      <td>${lokasiNama}</td>
      <td>${item.kategori}</td>
      <td>${item.kondisi}</td>
      <td>${item.jumlah}</td>
    `;
    table.appendChild(row);
  });
}

async function handleExportAset() {
  const lokasiId = document.getElementById("laporanLokasi").value;
  const kategori = document.getElementById("laporanKategori").value;
  const kondisi = document.getElementById("laporanKondisi").value;

  await exportAsetData({
    lokasiId: lokasiId ? Number(lokasiId) : null,
    kategori: kategori || null,
    kondisi: kondisi || null
  });
}
