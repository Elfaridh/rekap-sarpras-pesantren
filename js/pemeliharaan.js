function tambahPemeliharaan(aset_id, catatan, tanggal) {
  const tx = db.transaction("pemeliharaan", "readwrite");
  tx.objectStore("pemeliharaan").add({
    aset_id, catatan, tanggal
  });
}
