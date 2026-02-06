function tambahAset(data) {
  const tx = db.transaction("aset", "readwrite");
  tx.objectStore("aset").add(data);
}
