function hitungDashboard() {
  const tx = db.transaction("aset", "readonly");
  const store = tx.objectStore("aset");
  let total = 0, rusak = 0;

  store.openCursor().onsuccess = e => {
    const c = e.target.result;
    if (c) {
      total++;
      if (c.value.kondisi !== "Baik") rusak++;
      c.continue();
    }
  };
}
