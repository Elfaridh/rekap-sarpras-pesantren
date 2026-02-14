window.pageInit = async function () {
  const aset = await getAll("aset");
  const lokasi = await getAll("lokasi");
  const pemeliharaan = await getAll("pemeliharaan");

  const normalizeKondisi = value => String(value || "").toLowerCase().trim();
  const isBaik = item => {
    const kondisi = normalizeKondisi(item.kondisi);
    return kondisi === "baik" || kondisi.startsWith("baik ") || kondisi === "ok" || kondisi === "normal";
  };

  const totalAset = aset.reduce((sum, item) => sum + Number(item.jumlah || 0), 0);
  const totalBaik = aset
    .filter(isBaik)
    .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);
  const totalRusak = aset
    .filter(item => !isBaik(item))
    .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);

  const lastMaintenanceMap = new Map();
  pemeliharaan.forEach(record => {
    const current = lastMaintenanceMap.get(record.asetId);
    if (!current || new Date(record.tanggal) > new Date(current)) {
      lastMaintenanceMap.set(record.asetId, record.tanggal);
    }
  });

  const today = new Date();
  const sixMonthsMs = 1000 * 60 * 60 * 24 * 30 * 6;

  const prioritas = aset.filter(item => {
    const last = lastMaintenanceMap.get(item.id);
    const overdue = last ? (today - new Date(last) > sixMonthsMs) : false;
    return !isBaik(item) || overdue;
  });

  document.getElementById("totalAset").textContent = totalAset;
  document.getElementById("totalBaik").textContent = totalBaik;
  document.getElementById("totalRusak").textContent = totalRusak;
  document.getElementById("totalLokasi").textContent = `${lokasi.length} lokasi aktif`;

  const container = document.getElementById("prioritasContainer");
  container.innerHTML = "";

  if (prioritas.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Belum ada aset yang membutuhkan perawatan segera.";
    container.appendChild(empty);
    return;
  }

  prioritas.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    const last = lastMaintenanceMap.get(item.id);
    const lokasiNama = lokasi.find(loc => loc.id === item.lokasiId)?.nama || "-";
    const label = !isBaik(item) ? "Kondisi perlu perbaikan" : "Jadwal perawatan rutin";

    card.innerHTML = `
      <h3>${item.nama}</h3>
      <p class="muted">Lokasi: ${lokasiNama}</p>
      <p><strong>${label}</strong></p>
      <p>Kondisi: <strong>${item.kondisi}</strong></p>
      <p class="muted">Terakhir dirawat: ${formatDate(last)}</p>
    `;
    container.appendChild(card);
  });
};
