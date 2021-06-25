function listLogs() {
  const url = getApiBase();
  fetch(url, {
    mode: "same-origin",
  }).then((res) =>
    res.json().then((res) => {
      const fileChooser = document.getElementById("fileChooser");
      res.forEach((val) => {
        let opt = document.createElement("option");
        opt.value = val;
        opt.innerHTML = val;
        fileChooser.appendChild(opt);
      });
    })
  );
}

function fetchLog() {
  const fileName = document.getElementById("fileChooser").value;
  const url = getApiBase() + fileName;
  fetch(url, { mode: "same-origin" })
    .then((res) => res.text())
    .then((res) => {
      console.log(res);
      document.getElementById("logOutput").innerHTML = res;
    });
}

function getApiBase() {
  const remoteIp = document.getElementById("ipAddr").value || "localhost";
  const port = document.getElementById("port").value || 3000;
  return `http://${remoteIp}:${port}/log/`;
}
