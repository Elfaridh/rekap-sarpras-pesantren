const DB_NAME = "sarprasDB";
const DB_VERSION = 2;
let dbInstance;

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("users")) {
        db.createObjectStore("users", { keyPath: "username" });
      }
      if (!db.objectStoreNames.contains("lokasi")) {
        db.createObjectStore("lokasi", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("aset")) {
        const asetStore = db.createObjectStore("aset", { keyPath: "id", autoIncrement: true });
        asetStore.createIndex("lokasiId", "lokasiId", { unique: false });
        asetStore.createIndex("kategori", "kategori", { unique: false });
        asetStore.createIndex("kondisi", "kondisi", { unique: false });
      }
      if (!db.objectStoreNames.contains("pemeliharaan")) {
        const pemStore = db.createObjectStore("pemeliharaan", { keyPath: "id", autoIncrement: true });
        pemStore.createIndex("asetId", "asetId", { unique: false });
      }
      if (!db.objectStoreNames.contains("mutasi")) {
        const mutasiStore = db.createObjectStore("mutasi", { keyPath: "id", autoIncrement: true });
        mutasiStore.createIndex("asetId", "asetId", { unique: false });
      }
    };

    request.onsuccess = event => {
      dbInstance = event.target.result;
      Promise.resolve(seedDefaults()).then(() => resolve(dbInstance));
    };

    request.onerror = () => reject(request.error);
  });
}

function withStore(storeName, mode, callback) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let request;
      try {
        request = callback(store);
      } catch (error) {
        reject(error);
        return;
      }
      tx.oncomplete = () => resolve(request?.result);
      tx.onerror = () => reject(tx.error);
    });
  });
}

function getAll(storeName) {
  return withStore(storeName, "readonly", store => store.getAll());
}

function getByKey(storeName, key) {
  return withStore(storeName, "readonly", store => store.get(key));
}

function addItem(storeName, value) {
  return withStore(storeName, "readwrite", store => store.add(value));
}

function updateItem(storeName, value) {
  return withStore(storeName, "readwrite", store => store.put(value));
}

function deleteItem(storeName, key) {
  return withStore(storeName, "readwrite", store => store.delete(key));
}

async function seedDefaults() {
  const users = await getAll("users");
  if (users.length === 0) {
    await addItem("users", { username: "admin", password: "admin123", role: "Admin" });
    await addItem("users", { username: "petugas", password: "petugas123", role: "Petugas" });
  }

  const lokasi = await getAll("lokasi");
  if (lokasi.length === 0) {
    const defaultLokasi = [
      { nama: "Asrama Putra", tipe: "Asrama", catatan: "Gedung utama" },
      { nama: "Asrama Putri", tipe: "Asrama", catatan: "Gedung timur" },
      { nama: "Masjid", tipe: "Masjid", catatan: "Area ibadah" },
      { nama: "Kantor TU", tipe: "Kantor", catatan: "Administrasi" },
      { nama: "Gudang Utama", tipe: "Gudang", catatan: "Penyimpanan" }
    ];
    for (const item of defaultLokasi) {
      await addItem("lokasi", item);
    }
  }
}

function formatDate(dateString) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}
