function exportCSV(data) {
  let csv = "Nama,Kategori,Kondisi\n";
  data.forEach(d => {
    csv += `${d.nama},${d.kategori},${d.kondisi}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sarpras.csv";
  a.click();
}
