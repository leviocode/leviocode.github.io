let opened = (val) => {
  window.open(val, "_parent");
};

setInterval(() => opened("/home"), 3000);
