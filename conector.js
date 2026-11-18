
console.log("Conector JavaScript carregado!");

const API_URL = "http://127.0.0.1:8000";

// Elementos do HTML
const formulario = document.getElementById("form-consulta");
const inputIP = document.getElementById("input-ip");
const botao = document.getElementById("btn-consultar");

// Exibir informações recebidas do Python
function criarInfoGrid(dados, containerId) {
    const container = document.getElementById(containerId);
    container.replaceChildren();

    const itens = [
        { label: "País", valor: dados.pais },
        { label: "Provedor", valor: dados.provedor },
        { label: "Domínio", valor: dados.dominio },
        { label: "Pontuação de abuso", valor: dados.pontuacao_abuso + "/100" },
        { label: "Total de denúncias", valor: dados.total_denuncias },
        { label: "Usuários denunciantes", valor: dados.usuarios_denunciantes },
        { label: "Última denúncia", valor: dados.ultima_denuncia },
        { label: "Tipo de uso", valor: dados.tipo_uso },
        {
            label: "Lista branca",
            valor: dados.na_lista_branca ? "Sim" : "Não"
        }
    ];

    itens.forEach(item => {
        const elemento = document.createElement("div");
        elemento.className = "info-item";

        const titulo = document.createElement("strong");
        titulo.textContent = item.label;

        const valor = document.createElement("span");
        valor.textContent =
            item.valor !== null && item.valor !== undefined && item.valor !== ""
                ? item.valor
                : "Não informado";

        elemento.append(titulo, valor);
        container.appendChild(elemento);
    });
}

// Consultar endereço IP
formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const ip = inputIP.value.trim();

    if (!ip) return;

    botao.disabled = true;
    botao.textContent = "Consultando...";

    try {
        const resposta = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ ip: ip })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro na consulta");
        }

        if (dados.erro) {
            throw new Error(dados.erro);
        }

        document.getElementById("ip-consultado").textContent = dados.ip;

        criarInfoGrid(dados, "info-consulta");

        document.getElementById("resultado-consulta").style.display = "block";

        console.log("Consulta realizada:", dados);

    } catch (erro) {
        console.error("Erro na consulta:", erro);

        alert("Não foi possível consultar o IP: " + erro.message);

        document.getElementById("resultado-consulta").style.display = "none";

    } finally {
        botao.disabled = false;
        botao.textContent = "Consultar";
    }
});
