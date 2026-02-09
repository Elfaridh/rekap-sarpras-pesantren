window.pageInit = async function () {
  await loadAsetOptions();
  await renderPemeliharaanTable();

  document.getElementById("pemeliharaanForm").addEventListener("submit", handlePemeliharaanSubmit);
};

async function loadAsetOptions() {
  const aset = await getAll("aset");
  const select = document.getElementById("asetPemeliharaan");
  select.innerHTML = "";
  aset.forEach(item => {
    select.appendChild(createOption(item.id, item.nama));
  });
}

async function handlePemeliharaanSubmit(event) {
  event.preventDefault();
  const asetId = Number(document.getElementById("asetPemeliharaan").value);
  const tanggal = document.getElementById("tanggalPemeliharaan").value;
  const catatan = document.getElementById("catatanPemeliharaan").value.trim();
  const message = document.getElementById("pemeliharaanMessage");

  if (!asetId || !tanggal) return;

  await addItem("pemeliharaan", {
    asetId,
    tanggal,
    catatan,
    createdAt: new Date().toISOString()
  });

  message.textContent = "Riwayat pemeliharaan tersimpan.";
  message.style.color = "#16a34a";
  document.getElementById("pemeliharaanForm").reset();
  await renderPemeliharaanTable();
}

async function renderPemeliharaanTable() {
  const aset = await getAll("aset");
  const lokasi = await getAll("lokasi");
  const pemeliharaan = await getAll("pemeliharaan");

  const table = document.getElementById("pemeliharaanTable");
  table.innerHTML = "";

  pemeliharaan.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  pemeliharaan.forEach(item => {
    const asetData = aset.find(data => data.id === item.asetId);
    const lokasiData = lokasi.find(loc => loc.id === asetData?.lokasiId);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatDate(item.tanggal)}</td>
      <td>${asetData?.nama || "-"}</td>
      <td>${lokasiData?.nama || "-"}</td>
      <td>${item.catatan || "-"}</td>
      <td><button class="btn-danger" data-delete="${item.id}">Hapus</button></td>
    `;
    table.appendChild(row);
  });

  table.querySelectorAll("button[data-delete]").forEach(button => {
    button.addEventListener("click", () => deletePemeliharaan(Number(button.dataset.delete)));
  });
}

async function deletePemeliharaan(id) {
  if (!confirm("Hapus riwayat ini?")) return;
  await deleteItem("pemeliharaan", id);
  await renderPemeliharaanTable();
}
