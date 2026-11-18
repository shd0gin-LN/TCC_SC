
console.log("Conector JavaScript carregado!");

const API_URL = "/api";

const formulario = document.getElementById("form-consulta");
const inputIP = document.getElementById("input-ip");
const botao = document.getElementById("btn-consultar");

// Cria os elementos de informação
function criarInfoGrid(itens, containerId) {
    const container = document.getElementById(containerId);
    container.replaceChildren();

    itens.forEach(item => {
        const elemento = document.createElement("div");
        elemento.className = "info-item";

        const titulo = document.createElement("strong");
        titulo.textContent = item.label;

        const valor = document.createElement("span");
        valor.textContent = item.valor ?? "Não informado";

        if (item.cor) {
            valor.style.color = item.cor;
        }

        elemento.append(titulo, valor);
        container.appendChild(elemento);
    });
}

// Informações geográficas
function dadosGeograficos(dados) {
    return [
        { label: "Cidade", valor: dados.city },
        { label: "Região", valor: dados.region },
        { label: "País", valor: dados.country_name },
        { label: "Provedor", valor: dados.org },
        { label: "Fuso horário", valor: dados.timezone },
        { label: "Latitude", valor: dados.latitude },
        { label: "Longitude", valor: dados.longitude }
    ];
}

// Consulta o backend Python
async function consultarSeguranca(ip) {
    const resposta = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ ip })
    });

    const dados = await resposta.json();

    if (!resposta.ok || dados.erro) {
        throw new Error(dados.erro || "Erro na API");
    }

    return dados;
}

// Classificação de reputação
function classificarRisco(pontuacao) {
    if (typeof pontuacao !== "number") {
        return {
            texto: "Desconhecido",
            cor: "#94a3b8"
        };
    }

    if (pontuacao < 25) {
        return {
            texto: "Baixo risco",
            cor: "#22c55e"
        };
    }

    if (pontuacao < 75) {
        return {
            texto: "Atenção",
            cor: "#eab308"
        };
    }

    return {
        texto: "Alto risco",
        cor: "#ef4444"
    };
}

// Organiza os dados da AbuseIPDB
function dadosSeguranca(dados) {
    const risco = classificarRisco(dados.pontuacao_abuso);

    return [
        {
            label: "Reputação do IP",
            valor: risco.texto,
            cor: risco.cor
        },
        {
            label: "Pontuação de abuso",
            valor: dados.pontuacao_abuso != null
                ? dados.pontuacao_abuso + "/100"
                : "Não informado"
        },
        {
            label: "Total de denúncias",
            valor: dados.total_denuncias
        },
        {
            label: "Usuários denunciantes",
            valor: dados.usuarios_denunciantes
        },
        {
            label: "Última denúncia",
            valor: dados.ultima_denuncia
        },
        {
            label: "Domínio",
            valor: dados.dominio
        },
        {
            label: "Tipo de uso",
            valor: dados.tipo_uso
        },
        {
            label: "Lista branca",
            valor: dados.na_lista_branca == null
                ? "Não informado"
                : dados.na_lista_branca ? "Sim" : "Não"
        }
    ];
}

// Consulta geográfica
async function consultarGeolocalizacao(ip) {
    const url = ip
        ? `https://ipapi.co/${encodeURIComponent(ip)}/json/`
        : "https://ipapi.co/json/";

    const resposta = await fetch(url, {
        cache: "no-store"
    });

    const dados = await resposta.json();

    if (!resposta.ok || dados.error) {
        throw new Error(dados.reason || "Erro na geolocalização");
    }

    return dados;
}

// Carrega o IP público do usuário
async function carregarMeuIP() {
    try {
        const dados = await consultarGeolocalizacao();

        document.getElementById("meu-ip-valor")
            .textContent = dados.ip;

        criarInfoGrid(
            dadosGeograficos(dados),
            "meu-ip-info"
        );

    } catch (erro) {
        document.getElementById("meu-ip-valor")
            .textContent = "Erro ao carregar IP";

        console.error(erro);
    }
}

// Consulta o IP digitado
formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const ip = inputIP.value.trim();

    if (!ip) return;

    const resultado = document.getElementById("resultado-consulta");
    const ipConsultado = document.getElementById("ip-consultado");
    const info = document.getElementById("info-consulta");

    // Limpa os resultados anteriores
    resultado.style.display = "none";
    info.replaceChildren();
    ipConsultado.textContent = "";

    botao.disabled = true;
    botao.textContent = "Consultando...";

    try {
        const seguranca = await consultarSeguranca(ip);

        const itens = dadosSeguranca(seguranca);

        try {
            const geo = await consultarGeolocalizacao(seguranca.ip);
            itens.push(...dadosGeograficos(geo));
        } catch (erro) {
            itens.push({
                label: "Geolocalização",
                valor: "Indisponível"
            });
        }

        ipConsultado.textContent = seguranca.ip;

        criarInfoGrid(itens, "info-consulta");

        resultado.style.display = "block";

    } catch (erro) {
        alert("Erro na consulta: " + erro.message);
        console.error(erro);

    } finally {
        botao.disabled = false;
        botao.textContent = "Consultar";
    }
});

carregarMeuIP();
 