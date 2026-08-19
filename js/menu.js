let menu = (val) => {
  let snav = document.querySelector(".snav");

  val == 0 ? (snav.style = "display: none") : (snav.style = "display: block");
};
