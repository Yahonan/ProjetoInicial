const form = document.getElementById("form-tarefa");
const campo = document.getElementById("campo-tarefa");
const campoPrioridade = document.getElementById("campo-prioridade");
const colunas = document.querySelectorAll(".coluna");
const campoFiltro = document.getElementById("campo-filtro");
const botaoLimpar = document.getElementById("limpar-concluidos");

const nomesPrioridade = { alta: "Alta", media: "Média", baixa: "Baixa" };
const pesoPrioridade = { alta: 0, media: 1, baixa: 2 };

let tarefas = JSON.parse(localStorage.getItem("tarefas")) || [];
let filtro = "";

function salvar() {
  localStorage.setItem("tarefas", JSON.stringify(tarefas));
}

function editarTarefa(tarefa, card, texto) {
  const campoEdicao = document.createElement("input");
  campoEdicao.className = "edicao";
  campoEdicao.value = tarefa.texto;

  card.draggable = false;
  texto.replaceWith(campoEdicao);
  campoEdicao.focus();
  campoEdicao.select();

  let terminou = false;

  function terminar(salvarMudanca) {
    if (terminou) return;
    terminou = true;

    const novoTexto = campoEdicao.value.trim();
    if (salvarMudanca && novoTexto) {
      tarefa.texto = novoTexto;
      salvar();
    }
    renderizar();
  }

  campoEdicao.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") terminar(true);
    if (evento.key === "Escape") terminar(false);
  });

  campoEdicao.addEventListener("blur", () => terminar(true));
}

function criarCard(tarefa) {
  const prioridade = tarefa.prioridade || "media";

  const card = document.createElement("article");
  card.className = "card";
  card.draggable = true;

  const corpo = document.createElement("div");
  corpo.className = "card-corpo";

  const etiqueta = document.createElement("span");
  etiqueta.className = `etiqueta ${prioridade}`;
  etiqueta.textContent = nomesPrioridade[prioridade];

  const texto = document.createElement("p");
  texto.textContent = tarefa.texto;
  texto.title = "Clique duas vezes para editar";
  texto.addEventListener("dblclick", () => editarTarefa(tarefa, card, texto));

  const remover = document.createElement("button");
  remover.className = "remover";
  remover.textContent = "×";
  remover.setAttribute("aria-label", "Remover tarefa");

  remover.addEventListener("click", () => {
    tarefas = tarefas.filter((item) => item.id !== tarefa.id);
    salvar();
    renderizar();
  });

  card.addEventListener("dragstart", (evento) => {
    evento.dataTransfer.setData("text/plain", tarefa.id);
    card.classList.add("arrastando");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("arrastando");
  });

  corpo.append(etiqueta, texto);
  card.append(corpo, remover);
  return card;
}

function renderizar() {
  colunas.forEach((coluna) => {
    const nome = coluna.dataset.coluna;
    const area = coluna.querySelector(".cards");
    const contador = coluna.querySelector(".contador");

    const daColuna = tarefas
      .filter((tarefa) => tarefa.coluna === nome)
      .filter((tarefa) => tarefa.texto.toLowerCase().includes(filtro))
      .sort((a, b) => pesoPrioridade[a.prioridade || "media"] - pesoPrioridade[b.prioridade || "media"]);

    area.innerHTML = "";
    daColuna.forEach((tarefa) => area.appendChild(criarCard(tarefa)));
    contador.textContent = daColuna.length;
  });
}

colunas.forEach((coluna) => {
  coluna.addEventListener("dragover", (evento) => {
    evento.preventDefault();
    coluna.classList.add("sobre");
  });

  coluna.addEventListener("dragleave", (evento) => {
    if (!coluna.contains(evento.relatedTarget)) {
      coluna.classList.remove("sobre");
    }
  });

  coluna.addEventListener("drop", (evento) => {
    evento.preventDefault();
    coluna.classList.remove("sobre");

    const id = evento.dataTransfer.getData("text/plain");
    const tarefa = tarefas.find((item) => item.id === id);

    if (tarefa) {
      tarefa.coluna = coluna.dataset.coluna;
      salvar();
      renderizar();
    }
  });
});

campoFiltro.addEventListener("input", () => {
  filtro = campoFiltro.value.trim().toLowerCase();
  renderizar();
});

botaoLimpar.addEventListener("click", () => {
  const concluidas = tarefas.filter((tarefa) => tarefa.coluna === "concluido");
  if (concluidas.length === 0) return;

  if (confirm(`Remover ${concluidas.length} tarefa(s) concluída(s)?`)) {
    tarefas = tarefas.filter((tarefa) => tarefa.coluna !== "concluido");
    salvar();
    renderizar();
  }
});

form.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const texto = campo.value.trim();
  if (!texto) return;

  tarefas.push({
    id: Date.now().toString(),
    texto: texto,
    prioridade: campoPrioridade.value,
    coluna: "fazer",
  });

  salvar();
  renderizar();
  form.reset();
  campo.focus();
});

renderizar();
