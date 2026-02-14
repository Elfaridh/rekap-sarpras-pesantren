const FIELD_ALIASES = {
  nama: ["nama", "nama aset", "nama barang", "item", "asset", "name"],
  tipe: ["tipe", "kategori area", "jenis", "kategori lokasi"],
  kategori: ["kategori", "category"],
  catatan: ["catatan", "keterangan", "deskripsi", "notes"],
  lokasi: ["lokasi", "nama lokasi", "lokasi nama", "ruangan", "area"],
  kondisi: ["kondisi", "condition", "status"],
  jumlah: ["jumlah", "qty", "kuantitas", "total"],
  tahun: ["tahun", "tahun perolehan", "year"],
  aset: ["aset", "asset", "nama aset", "nama barang"],
  tanggal: ["tanggal", "date", "tgl"],
  dari: ["dari", "asal", "from", "dari lokasi"],
  ke: ["ke", "tujuan", "to", "ke lokasi"],
  penanggungJawab: ["penanggung jawab", "penanggungjawab", "pic", "petugas", "penanggung"]
};

function parseDelimited(text, delimiter = ",") {
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

    if (char === delimiter && !inQuotes) {
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
  return String(header || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeObjectKeys(item) {
  return Object.keys(item || {}).reduce((acc, key) => {
    acc[normalizeHeader(key)] = item[key];
    return acc;
  }, {});
}

function guessDelimiter(line) {
  if (!line) return ",";
  const comma = (line.match(/,/g) || []).length;
  const semi = (line.match(/;/g) || []).length;
  const tab = (line.match(/\t/g) || []).length;
  if (tab >= comma && tab >= semi) return "\t";
  if (semi > comma) return ";";
  return ",";
}

function mapRowToObject(headers, row) {
  const obj = {};
  headers.forEach((header, idx) => {
    obj[header] = row[idx] ?? "";
  });
  return obj;
}

function getValue(row, field) {
  const aliases = FIELD_ALIASES[field] || [field];
  for (const alias of aliases) {
    const key = normalizeHeader(alias);
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  return "";
}

function detectType(rows) {
  if (!rows.length) return "";

  const scoring = { lokasi: 0, aset: 0, pemeliharaan: 0, mutasi: 0 };
  rows.slice(0, 10).forEach(row => {
    const nama = getValue(row, "nama");
    const lokasi = getValue(row, "lokasi");
    const kategori = getValue(row, "kategori") || getValue(row, "tipe");
    const kondisi = getValue(row, "kondisi");
    const aset = getValue(row, "aset");
    const tanggal = getValue(row, "tanggal");
    const dari = getValue(row, "dari");
    const ke = getValue(row, "ke");
    const catatan = getValue(row, "catatan");

    if (nama && kategori && !kondisi && !lokasi) scoring.lokasi += 2;
    if (nama && lokasi && kondisi) scoring.aset += 3;
    if (aset && tanggal && catatan) scoring.pemeliharaan += 3;
    if (aset && dari && ke && tanggal) scoring.mutasi += 3;
  });

  return Object.entries(scoring).sort((a, b) => b[1] - a[1])[0][1] > 0
    ? Object.entries(scoring).sort((a, b) => b[1] - a[1])[0][0]
    : "";
}

async function parseImportFile(file) {
  const extension = file.name.toLowerCase().split(".").pop();

  if (extension === "json") {
    const text = await file.text();
    const json = JSON.parse(text);
    const rows = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
    return rows.map(normalizeObjectKeys);
  }

  const text = await file.text();
  if (!text || !text.trim()) {
    throw new Error("File kosong atau tidak dapat dibaca sebagai teks.");
  }

  if (extension === "xlsx") {
    throw new Error("Format .xlsx murni belum dapat diproses langsung. Silakan simpan sebagai CSV dari Excel, atau gunakan .xls/.csv dengan data teks.");
  }

  const firstLine = text.split(/\r?\n/)[0] || "";
  const delimiter = guessDelimiter(firstLine);
  const rows = parseDelimited(text, delimiter);
  const headers = (rows.shift() || []).map(normalizeHeader);
  return rows.map(row => mapRowToObject(headers, row));
}

async function ensureLokasi(name, autoCreate) {
  if (!name) return null;
  const lokasiList = await getAll("lokasi");
  const found = lokasiList.find(item => item.nama.toLowerCase() === name.toLowerCase());
  if (found) return found;
  if (!autoCreate) return null;
  const id = await addItem("lokasi", { nama: name, tipe: "Lainnya", catatan: "Impor otomatis" });
  return { id, nama: name };
}

async function getAsetByName(name) {
  if (!name) return null;
  const asetList = await getAll("aset");
  return asetList.find(item => item.nama.toLowerCase() === name.toLowerCase()) || null;
}

async function importLokasi(rows) {
  let count = 0;
  for (const row of rows) {
    const nama = getValue(row, "nama");
    if (!nama) continue;
    await addItem("lokasi", {
      nama,
      tipe: getValue(row, "tipe") || getValue(row, "kategori") || "Lainnya",
      catatan: getValue(row, "catatan")
    });
    count++;
  }
  return count;
}

async function importAset(rows, autoLokasi) {
  let count = 0;
  for (const row of rows) {
    const nama = getValue(row, "nama");
    const lokasi = await ensureLokasi(getValue(row, "lokasi"), autoLokasi);
    if (!nama || !lokasi?.id) continue;

    await addItem("aset", {
      nama,
      lokasiId: lokasi.id,
      kategori: getValue(row, "kategori") || "Lainnya",
      kondisi: getValue(row, "kondisi") || "Baik",
      jumlah: Number(getValue(row, "jumlah") || 1),
      tahun: Number(getValue(row, "tahun") || new Date().getFullYear()),
      foto: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    count++;
  }
  return count;
}

async function importPemeliharaan(rows) {
  let count = 0;
  for (const row of rows) {
    const aset = await getAsetByName(getValue(row, "aset"));
    const tanggal = getValue(row, "tanggal");
    if (!aset?.id || !tanggal) continue;

    await addItem("pemeliharaan", {
      asetId: aset.id,
      tanggal,
      catatan: getValue(row, "catatan"),
      createdAt: new Date().toISOString()
    });
    count++;
  }
  return count;
}

async function importMutasi(rows, autoLokasi) {
  let count = 0;
  for (const row of rows) {
    const aset = await getAsetByName(getValue(row, "aset"));
    const tanggal = getValue(row, "tanggal");
    const dariLokasi = await ensureLokasi(getValue(row, "dari"), autoLokasi);
    const keLokasi = await ensureLokasi(getValue(row, "ke"), autoLokasi);
    if (!aset?.id || !tanggal || !keLokasi?.id) continue;

    await addItem("mutasi", {
      asetId: aset.id,
      dariLokasiId: dariLokasi?.id || null,
      keLokasiId: keLokasi.id,
      tanggal,
      penanggungJawab: getValue(row, "penanggungJawab") || "-"
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
  const autoLokasi = document.getElementById("autoLokasi").value === "ya";
  const message = document.getElementById("importMessage");
  const file = fileInput.files[0];

  if (!file) {
    message.textContent = "Pilih file CSV, JSON, XLS, atau XLSX terlebih dahulu.";
    message.style.color = "#dc2626";
    return;
  }

  try {
    const rows = await parseImportFile(file);
    if (!rows.length) {
      throw new Error("Data tidak ditemukan di file.");
    }

    const detectedType = typeSelect.value === "auto" ? detectType(rows) : typeSelect.value;
    if (!detectedType) {
      throw new Error("Tipe data tidak terdeteksi. Pilih tipe data secara manual.");
    }

    let imported = 0;
    if (detectedType === "lokasi") imported = await importLokasi(rows);
    if (detectedType === "aset") imported = await importAset(rows, autoLokasi);
    if (detectedType === "pemeliharaan") imported = await importPemeliharaan(rows);
    if (detectedType === "mutasi") imported = await importMutasi(rows, autoLokasi);

    message.textContent = `Impor selesai. ${imported} data ${detectedType} berhasil ditambahkan.`;
    message.style.color = "#16a34a";
    fileInput.value = "";
    if (window.pageInit) window.pageInit();
  } catch (error) {
    message.textContent = `Impor gagal: ${error.message}`;
    message.style.color = "#dc2626";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const importButton = document.getElementById("importButton");
  if (importButton) importButton.addEventListener("click", handleImport);
});
