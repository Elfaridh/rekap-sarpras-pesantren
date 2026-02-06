let db;

const request = indexedDB.open("sarprasDB", 1);

request.onupgradeneeded = e => {
  db = e.target.result;

  db.createObjectStore("users", { keyPath: "username" });
  db.createObjectStore("lokasi", { keyPath: "id", autoIncrement: true });
  db.createObjectStore("aset", { keyPath: "id", autoIncrement: true });
  db.createObjectStore("pemeliharaan", { keyPath: "id", autoIncrement: true });
  db.createObjectStore("mutasi", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = e => db = e.target.result;
