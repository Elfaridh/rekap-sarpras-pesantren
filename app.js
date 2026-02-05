let data = JSON.parse(localStorage.getItem("sarpras")) || [];

function simpan() {
  const nama = document.getElementById("nama").value;
  const jumlah = document.getElementById("jumlah").value;
  const kondisi = document.getElementById("kondisi").value;

  if (!nama || !jumlah) return alert("Lengkapi data");

  data.push({ nama, jumlah, kondisi });
  localStorage.setItem("sarpras", JSON.stringify(data));

  document.getElementById("nama").value = "";
  document.getElementById("jumlah").value = "";

  tampil();
}

function tampil() {
  const list = document.getElementById("list");
  list.innerHTML = "";

  data.forEach(item => {
    const li = document.createElement("li");
    li.innerText = `${item.nama} | ${item.jumlah} | ${item.kondisi}`;
    list.appendChild(li);
  });
}

tampil();
