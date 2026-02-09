let editingLokasiId = null;

window.pageInit = async function () {
  await renderLokasiTable();
  const form = document.getElementById("lokasiForm");
  const resetBtn = document.getElementById("resetLokasi");

  form.addEventListener("submit", handleLokasiSubmit);
  resetBtn.addEventListener("click", resetLokasiForm);
};

async function handleLokasiSubmit(event) {
  event.preventDefault();
  const nama = document.getElementById("namaLokasi").value.trim();
  const tipe = document.getElementById("tipeLokasi").value;
  const catatan = document.getElementById("catatanLokasi").value.trim();
  const message = document.getElementById("lokasiMessage");

  if (!nama) return;

  const payload = { nama, tipe, catatan };
  if (editingLokasiId) {
    payload.id = editingLokasiId;
    await updateItem("lokasi", payload);
    message.textContent = "Lokasi berhasil diperbarui.";
  } else {
    await addItem("lokasi", payload);
    message.textContent = "Lokasi berhasil ditambahkan.";
  }
  message.style.color = "#16a34a";
  resetLokasiForm();
  await renderLokasiTable();
}

function resetLokasiForm() {
  editingLokasiId = null;
  document.getElementById("lokasiForm").reset();
  document.getElementById("lokasiMessage").textContent = "";
}

async function renderLokasiTable() {
  const lokasi = await getAll("lokasi");
  const table = document.getElementById("lokasiTable");
  table.innerHTML = "";

  lokasi.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.nama}</td>
      <td>${item.tipe}</td>
      <td>${item.catatan || "-"}</td>
      <td class="action-group">
        <button class="btn-secondary" data-edit="${item.id}">Edit</button>
        <button class="btn-danger" data-delete="${item.id}">Hapus</button>
      </td>
    `;
    table.appendChild(row);
  });

  table.querySelectorAll("button[data-edit]").forEach(button => {
    button.addEventListener("click", () => editLokasi(Number(button.dataset.edit)));
  });

  table.querySelectorAll("button[data-delete]").forEach(button => {
    button.addEventListener("click", () => deleteLokasi(Number(button.dataset.delete)));
  });
}

async function editLokasi(id) {
  const lokasi = await getByKey("lokasi", id);
  if (!lokasi) return;
  editingLokasiId = id;
  document.getElementById("namaLokasi").value = lokasi.nama;
  document.getElementById("tipeLokasi").value = lokasi.tipe;
  document.getElementById("catatanLokasi").value = lokasi.catatan || "";
}

async function deleteLokasi(id) {
  if (!confirm("Hapus lokasi ini?")) return;
  await deleteItem("lokasi", id);
  await renderLokasiTable();
}
