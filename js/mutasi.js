window.pageInit = async function () {
  await loadMutasiOptions();
  await renderMutasiTable();

  document.getElementById("asetMutasi").addEventListener("change", updateDariLokasi);
  document.getElementById("mutasiForm").addEventListener("submit", handleMutasiSubmit);
};

async function loadMutasiOptions() {
  const aset = await getAll("aset");
  const lokasi = await getAll("lokasi");
  const asetSelect = document.getElementById("asetMutasi");
  const keLokasiSelect = document.getElementById("keLokasi");

  asetSelect.innerHTML = "";
  keLokasiSelect.innerHTML = "";

  aset.forEach(item => {
    asetSelect.appendChild(createOption(item.id, item.nama));
  });

  lokasi.forEach(item => {
    keLokasiSelect.appendChild(createOption(item.id, item.nama));
  });

  updateDariLokasi();
}

async function updateDariLokasi() {
  const asetId = Number(document.getElementById("asetMutasi").value);
  const aset = await getByKey("aset", asetId);
  const lokasi = await getByKey("lokasi", aset?.lokasiId);
  document.getElementById("dariLokasi").value = lokasi?.nama || "-";
}

async function handleMutasiSubmit(event) {
  event.preventDefault();
  const asetId = Number(document.getElementById("asetMutasi").value);
  const keLokasiId = Number(document.getElementById("keLokasi").value);
  const tanggal = document.getElementById("tanggalMutasi").value;
  const penanggungJawab = document.getElementById("penanggungJawab").value.trim();
  const message = document.getElementById("mutasiMessage");

  if (!asetId || !keLokasiId || !tanggal || !penanggungJawab) return;

  const aset = await getByKey("aset", asetId);
  const dariLokasiId = aset?.lokasiId || null;

  await addItem("mutasi", {
    asetId,
    dariLokasiId,
    keLokasiId,
    tanggal,
    penanggungJawab
  });

  if (aset) {
    aset.lokasiId = keLokasiId;
    await updateItem("aset", aset);
  }

  message.textContent = "Mutasi tersimpan dan lokasi aset diperbarui.";
  message.style.color = "#16a34a";
  document.getElementById("mutasiForm").reset();
  await loadMutasiOptions();
  await renderMutasiTable();
}

async function renderMutasiTable() {
  const aset = await getAll("aset");
  const lokasi = await getAll("lokasi");
  const mutasi = await getAll("mutasi");

  const table = document.getElementById("mutasiTable");
  table.innerHTML = "";

  mutasi.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

  mutasi.forEach(item => {
    const asetData = aset.find(data => data.id === item.asetId);
    const dari = lokasi.find(loc => loc.id === item.dariLokasiId);
    const ke = lokasi.find(loc => loc.id === item.keLokasiId);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatDate(item.tanggal)}</td>
      <td>${asetData?.nama || "-"}</td>
      <td>${dari?.nama || "-"}</td>
      <td>${ke?.nama || "-"}</td>
      <td>${item.penanggungJawab}</td>
    `;
    table.appendChild(row);
  });
}
