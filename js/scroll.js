window.onscroll = () => {
  scrolled();
};

let scrolled = () => {
  let head = document.querySelector(".head");
  document.body.scrollTop > 10 || document.documentElement.scrollTop > 10
    ? (head.style =
        "background: #000;  border-bottom: 1px solid #111; backdrop-filter: blur(10px);")
    : (head.style = "background: transparent");
};
