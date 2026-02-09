function parseCsv(text) {
  const rows = [];
  let current = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      current.push(value.trim());
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (value.length || current.length) {
        current.push(value.trim());
        rows.push(current);
        current = [];
        value = "";
      }
      continue;
    }

    value += char;
  }

  if (value.length || current.length) {
    current.push(value.trim());
    rows.push(current);
  }

  return rows.filter(row => row.some(cell => cell !== ""));
}

function normalizeHeader(header) {
  return header.toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeObjectKeys(item) {
  return Object.keys(item).reduce((acc, key) => {
    acc[normalizeHeader(key)] = item[key];
    return acc;
  }, {});
}

function detectType(headers) {
  const set = new Set(headers);
  if (set.has("nama") && (set.has("kategori") || set.has("tipe")) && !set.has("kondisi")) {
    return "lokasi";
  }
  if (set.has("nama") && set.has("lokasi") && set.has("kategori") && set.has("kondisi")) {
    return "aset";
  }
  if (set.has("aset") && set.has("tanggal") && set.has("catatan")) {
    return "pemeliharaan";
  }
  if (set.has("aset") && set.has("dari") && set.has("ke") && set.has("tanggal")) {
    return "mutasi";
  }
  return "";
}

function mapRowToObject(headers, row) {
  const obj = {};
  headers.forEach((header, idx) => {
    obj[header] = row[idx] ?? "";
  });
  return obj;
}

async function ensureLokasi(name, autoCreate) {
  if (!name) return null;
  const lokasi = await getAll("lokasi");
  const found = lokasi.find(item => item.nama.toLowerCase() === name.toLowerCase());
  if (found) return found;
  if (!autoCreate) return null;
  const id = await addItem("lokasi", { nama: name, tipe: "Lainnya", catatan: "Impor otomatis" });
  return { id, nama: name, tipe: "Lainnya", catatan: "Impor otomatis" };
}

async function getAsetByName(name) {
  if (!name) return null;
  const aset = await getAll("aset");
  return aset.find(item => item.nama.toLowerCase() === name.toLowerCase()) || null;
}

async function importLokasi(data) {
  let count = 0;
  for (const row of data) {
    if (!row.nama) continue;
    await addItem("lokasi", {
      nama: row.nama,
      tipe: row.kategori || row.tipe || "Lainnya",
      catatan: row.catatan || ""
    });
    count++;
  }
  return count;
}

async function importAset(data, autoLokasi) {
  let count = 0;
  for (const row of data) {
    const lokasiName = row.lokasi || row["lokasi nama"] || row.lokasinama;
    const lokasi = row.lokasiId
      ? await getByKey("lokasi", Number(row.lokasiId))
      : await ensureLokasi(lokasiName, autoLokasi);

    if (!row.nama || !lokasi?.id) continue;

    await addItem("aset", {
      nama: row.nama,
      lokasiId: lokasi.id,
      kategori: row.kategori || "Lainnya",
      kondisi: row.kondisi || "Baik",
      jumlah: Number(row.jumlah || 1),
      tahun: Number(row.tahun || new Date().getFullYear()),
      foto: row.foto || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    count++;
  }
  return count;
}

async function importPemeliharaan(data) {
  let count = 0;
  for (const row of data) {
    const aset = row.asetId
      ? await getByKey("aset", Number(row.asetId))
      : await getAsetByName(row.aset);
    if (!aset?.id || !row.tanggal) continue;

    await addItem("pemeliharaan", {
      asetId: aset.id,
      tanggal: row.tanggal,
      catatan: row.catatan || "",
      createdAt: new Date().toISOString()
    });
    count++;
  }
  return count;
}

async function importMutasi(data, autoLokasi) {
  let count = 0;
  for (const row of data) {
    const aset = row.asetId
      ? await getByKey("aset", Number(row.asetId))
      : await getAsetByName(row.aset);
    if (!aset?.id || !row.tanggal) continue;

    const dariLokasi = row.dariId
      ? await getByKey("lokasi", Number(row.dariId))
      : await ensureLokasi(row.dari, autoLokasi);
    const keLokasi = row.keId
      ? await getByKey("lokasi", Number(row.keId))
      : await ensureLokasi(row.ke, autoLokasi);

    if (!keLokasi?.id) continue;

    await addItem("mutasi", {
      asetId: aset.id,
      dariLokasiId: dariLokasi?.id || null,
      keLokasiId: keLokasi.id,
      tanggal: row.tanggal,
      penanggungJawab: row.penanggungjawab || row["penanggung jawab"] || row.penanggung || row.pic || "-"
    });

    aset.lokasiId = keLokasi.id;
    await updateItem("aset", aset);
    count++;
  }
  return count;
}

async function handleImport() {
  const fileInput = document.getElementById("importFile");
  const typeSelect = document.getElementById("importType");
  const autoLokasiSelect = document.getElementById("autoLokasi");
  const message = document.getElementById("importMessage");
  const file = fileInput.files[0];

  if (!file) {
    message.textContent = "Pilih file CSV atau JSON terlebih dahulu.";
    message.style.color = "#dc2626";
    return;
  }

  const autoLokasi = autoLokasiSelect.value === "ya";
  const content = await file.text();
  let rows = [];
  let headers = [];
  let data = [];

  if (file.name.toLowerCase().endsWith(".json")) {
    const json = JSON.parse(content);
    if (Array.isArray(json)) {
      data = json.map(normalizeObjectKeys);
    } else if (json && Array.isArray(json.data)) {
      data = json.data.map(normalizeObjectKeys);
    }

    if (data.length) {
      headers = Object.keys(data[0]).map(normalizeHeader);
    }
  } else {
    rows = parseCsv(content);
    headers = (rows.shift() || []).map(normalizeHeader);
    data = rows.map(row => mapRowToObject(headers, row));
  }

  const detectedType = typeSelect.value === "auto" ? detectType(headers) : typeSelect.value;
  if (!detectedType) {
    message.textContent = "Tipe data tidak terdeteksi. Pilih tipe data secara manual.";
    message.style.color = "#dc2626";
    return;
  }

  let imported = 0;
  if (detectedType === "lokasi") imported = await importLokasi(data);
  if (detectedType === "aset") imported = await importAset(data, autoLokasi);
  if (detectedType === "pemeliharaan") imported = await importPemeliharaan(data);
  if (detectedType === "mutasi") imported = await importMutasi(data, autoLokasi);

  message.textContent = `Impor selesai. ${imported} data ${detectedType} berhasil ditambahkan.`;
  message.style.color = "#16a34a";
  fileInput.value = "";
  if (window.pageInit) window.pageInit();
}

document.addEventListener("DOMContentLoaded", () => {
  const importButton = document.getElementById("importButton");
  if (importButton) {
    importButton.addEventListener("click", handleImport);
  }
});
