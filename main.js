(() => {
  const nodes = document.querySelectorAll(".node");
  if (!nodes.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  let index = 0;
  setInterval(() => {
    nodes.forEach((node, i) => {
      node.style.transform = i === index ? "translateY(-2px)" : "translateY(0)";
      node.style.boxShadow =
        i === index ? "0 8px 20px rgba(19, 66, 82, 0.12)" : "none";
    });
    index = (index + 1) % nodes.length;
  }, 1600);
})();
