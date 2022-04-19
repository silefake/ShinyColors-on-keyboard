
export function console_style(color) {
  return `color: #fff; background-color: ${color}; padding: 0 4px;`;
}

export function create_element(html, style = "") {
  let entrance = document.createElement("template");
  entrance.innerHTML = html;
  if(style !== ""){
    entrance.content.firstElementChild.style = style;
  }
  return entrance.content.firstElementChild;
}

export function show_hint(text) {
  hint_box.textContent = text;
  document.body.appendChild(hint_box);
  document.body.appendChild(hba);
}

const [hint_box, hba] = (() => {
  const html = "<div class=\"hint_box\"> OK </div>";
  const style = "position: fixed; top: 30vh; left: 50vw; max-width: 10em; padding: 1em; background: rgba(98, 157, 151, 0.75); opacity: 0; pointer-events: none; transform: translate(-50%, -50%);";
  const css = `
<style>
.hint_box {
    animation-duration: 2s;
    animation-name: hint;
    animation-timing-function: linear;
}
@keyframes hint {
    0% { opacity: 0.95; }
    20% { opacity: 0.91; }
    40% { opacity: 0.83; }
    60% { opacity: 0.69; }
    80% { opacity: 0.44; }
    100% { opacity: 0; }
}
</style>`;

  let hint_box = create_element(html, style);
  let hba = create_element(css);
  hint_box.addEventListener("animationend", (e) => {
    hint_box.remove();
    hba.remove();
  });

  return [hint_box, hba];
})();