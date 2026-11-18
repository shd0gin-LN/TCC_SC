
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import ipaddress
import os
import urllib.request
import urllib.parse
import urllib.error


API_KEY = os.getenv("ABUSEIPDB_API_KEY")

ABUSEIPDB_URL = "https://api.abuseipdb.com/api/v2/check"


class handler(BaseHTTPRequestHandler):

    def responder(self, status, dados):
        corpo = json.dumps(dados).encode("utf-8")

        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(corpo)

    def do_OPTIONS(self):
        self.responder(200, {"status": "ok"})

    def do_GET(self):
        self.responder(200, {
            "status": "online",
            "mensagem": "API do verificador de IP funcionando"
        })

    def do_POST(self):
        try:
            tamanho = int(self.headers.get("Content-Length", "0"))

            if tamanho <= 0 or tamanho > 4096:
                self.responder(400, {"erro": "Requisicao invalida"})
                return

            corpo = self.rfile.read(tamanho)
            dados = json.loads(corpo.decode("utf-8"))

            if not isinstance(dados, dict):
                self.responder(400, {"erro": "Envie um objeto JSON"})
                return

            ip_informado = dados.get("ip")

            if not isinstance(ip_informado, str):
                self.responder(400, {"erro": "Informe um IP"})
                return

            endereco = ipaddress.ip_address(ip_informado.strip())

            if not endereco.is_global:
                self.responder(400, {
                    "erro": "Informe um endereco IP publico"
                })
                return

            if not API_KEY:
                self.responder(500, {
                    "erro": "Chave da AbuseIPDB nao configurada"
                })
                return

            parametros = urllib.parse.urlencode({
                "ipAddress": str(endereco),
                "maxAgeInDays": "90"
            })

            requisicao = urllib.request.Request(
                f"{ABUSEIPDB_URL}?{parametros}",
                headers={
                    "Key": API_KEY,
                    "Accept": "application/json"
                }
            )

            with urllib.request.urlopen(requisicao, timeout=15) as resposta:
                resultado = json.loads(resposta.read().decode("utf-8"))

            informacoes = resultado["data"]

            resposta_final = {
                "ip": informacoes.get("ipAddress"),
                "pais": informacoes.get("countryCode"),
                "provedor": informacoes.get("isp"),
                "dominio": informacoes.get("domain"),
                "pontuacao_abuso": informacoes.get("abuseConfidenceScore"),
                "total_denuncias": informacoes.get("totalReports"),
                "usuarios_denunciantes": informacoes.get("numDistinctUsers"),
                "ultima_denuncia": informacoes.get("lastReportedAt"),
                "tipo_uso": informacoes.get("usageType"),
                "na_lista_branca": informacoes.get("isWhitelisted")
            }

            self.responder(200, resposta_final)

        except json.JSONDecodeError:
            self.responder(400, {"erro": "JSON invalido"})

        except ValueError:
            self.responder(400, {"erro": "Endereco IP invalido"})

        except urllib.error.HTTPError as erro:
            self.responder(502, {
                "erro": "A AbuseIPDB retornou um erro",
                "codigo": erro.code
            })

        except urllib.error.URLError:
            self.responder(502, {
                "erro": "Nao foi possivel conectar a AbuseIPDB"
            })

        except Exception:
            self.log_error("Erro inesperado")
            self.responder(500, {
                "erro": "Erro interno no servidor"
            })


if __name__ == "__main__":
    servidor = HTTPServer(("127.0.0.1", 8000), handler)

    print("Servidor iniciado em http://127.0.0.1:8000")

    servidor.serve_forever()
