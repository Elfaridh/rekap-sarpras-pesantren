let editingAsetId = null;
let cachedLokasi = [];
let cachedAset = [];
let fotoData = "";

window.pageInit = async function () {
  await loadLokasiOptions();
  await renderAsetTable();

  document.getElementById("asetForm").addEventListener("submit", handleAsetSubmit);
  document.getElementById("resetAset").addEventListener("click", resetAsetForm);
  document.getElementById("fotoAset").addEventListener("change", handleFotoChange);
  document.getElementById("cariAset").addEventListener("input", renderAsetTable);
  document.getElementById("filterLokasi").addEventListener("change", renderAsetTable);
  document.getElementById("filterKategori").addEventListener("change", renderAsetTable);
  document.getElementById("filterKondisi").addEventListener("change", renderAsetTable);
};

async function loadLokasiOptions() {
  cachedLokasi = await getAll("lokasi");
  const lokasiSelect = document.getElementById("lokasiAset");
  const filterLokasi = document.getElementById("filterLokasi");

  lokasiSelect.innerHTML = "";
  filterLokasi.innerHTML = "";

  filterLokasi.appendChild(createOption("", "Semua"));
  cachedLokasi.forEach(lokasi => {
    const option = createOption(lokasi.id, lokasi.nama);
    const filterOption = createOption(lokasi.id, lokasi.nama);
    lokasiSelect.appendChild(option);
    filterLokasi.appendChild(filterOption);
  });
}

async function handleFotoChange(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("previewFoto");
  if (!file) {
    fotoData = "";
    preview.style.display = "none";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    fotoData = reader.result;
    preview.src = fotoData;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
}

async function handleAsetSubmit(event) {
  event.preventDefault();
  const nama = document.getElementById("namaAset").value.trim();
  const lokasiId = Number(document.getElementById("lokasiAset").value);
  const kategori = document.getElementById("kategoriAset").value;
  const kondisi = document.getElementById("kondisiAset").value;
  const jumlah = Number(document.getElementById("jumlahAset").value);
  const tahun = Number(document.getElementById("tahunAset").value);
  const message = document.getElementById("asetMessage");

  if (!nama || !lokasiId || !jumlah || !tahun) return;

  const payload = {
    nama,
    lokasiId,
    kategori,
    kondisi,
    jumlah,
    tahun,
    foto: fotoData,
    updatedAt: new Date().toISOString()
  };

  if (editingAsetId) {
    payload.id = editingAsetId;
    const existing = await getByKey("aset", editingAsetId);
    payload.foto = fotoData || existing?.foto || "";
    await updateItem("aset", payload);
    message.textContent = "Aset berhasil diperbarui.";
  } else {
    payload.createdAt = new Date().toISOString();
    await addItem("aset", payload);
    message.textContent = "Aset berhasil ditambahkan.";
  }
  message.style.color = "#16a34a";
  resetAsetForm();
  await renderAsetTable();
}

function resetAsetForm() {
  editingAsetId = null;
  fotoData = "";
  document.getElementById("asetForm").reset();
  const preview = document.getElementById("previewFoto");
  preview.style.display = "none";
  document.getElementById("asetMessage").textContent = "";
}

function badgeForCondition(kondisi) {
  if (kondisi === "Baik") return "badge badge-success";
  if (kondisi === "Rusak") return "badge badge-warning";
  return "badge badge-danger";
}

async function renderAsetTable() {
  cachedAset = await getAll("aset");
  const canDelete = isAdmin();
  const search = document.getElementById("cariAset").value.toLowerCase();
  const filterLokasi = document.getElementById("filterLokasi").value;
  const filterKategori = document.getElementById("filterKategori").value;
  const filterKondisi = document.getElementById("filterKondisi").value;

  const data = cachedAset.filter(item => {
    const matchNama = item.nama.toLowerCase().includes(search);
    const matchLokasi = !filterLokasi || item.lokasiId === Number(filterLokasi);
    const matchKategori = !filterKategori || item.kategori === filterKategori;
    const matchKondisi = !filterKondisi || item.kondisi === filterKondisi;
    return matchNama && matchLokasi && matchKategori && matchKondisi;
  });

  const table = document.getElementById("asetTable");
  table.innerHTML = "";

  data.forEach(item => {
    const lokasi = cachedLokasi.find(loc => loc.id === item.lokasiId);
    const deleteButton = canDelete
      ? `<button class="btn-danger" data-delete="${item.id}">Hapus</button>`
      : "";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.foto ? `<img src="${item.foto}" alt="${item.nama}">` : "-"}</td>
      <td>${item.nama}</td>
      <td>${lokasi?.nama || "-"}</td>
      <td>${item.kategori}</td>
      <td><span class="${badgeForCondition(item.kondisi)}">${item.kondisi}</span></td>
      <td>${item.jumlah}</td>
      <td class="action-group">
        <button class="btn-secondary" data-edit="${item.id}">Edit</button>
        ${deleteButton}
      </td>
    `;
    table.appendChild(row);
  });

  table.querySelectorAll("button[data-edit]").forEach(button => {
    button.addEventListener("click", () => editAset(Number(button.dataset.edit)));
  });
  if (canDelete) {
    table.querySelectorAll("button[data-delete]").forEach(button => {
      button.addEventListener("click", () => deleteAset(Number(button.dataset.delete)));
    });
  }
}

async function editAset(id) {
  const aset = await getByKey("aset", id);
  if (!aset) return;
  editingAsetId = id;
  fotoData = aset.foto || "";

  document.getElementById("namaAset").value = aset.nama;
  document.getElementById("lokasiAset").value = aset.lokasiId;
  document.getElementById("kategoriAset").value = aset.kategori;
  document.getElementById("kondisiAset").value = aset.kondisi;
  document.getElementById("jumlahAset").value = aset.jumlah;
  document.getElementById("tahunAset").value = aset.tahun;

  const preview = document.getElementById("previewFoto");
  if (aset.foto) {
    preview.src = aset.foto;
    preview.style.display = "block";
  } else {
    preview.style.display = "none";
  }
}

async function deleteAset(id) {
  if (!confirm("Hapus aset ini?")) return;
  await deleteItem("aset", id);
  await renderAsetTable();
}
