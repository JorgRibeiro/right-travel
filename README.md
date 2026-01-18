# Projeto: right travel

Este repositório contém a implementação prática de 4 tipos de Agentes Inteligentes utilizando fluxogramas no **n8n**. O objetivo é demonstrar o comportamento de diferentes arquiteturas de agentes em cenários de automação.

## 📂 Estrutura do Projeto

Os workflows estão organizados por tipo de agente:

* **`workflows/reflexivo-simples/`**: Agente que reage diretamente a uma entrada (Condição-Ação).
* **`workflows/baseado-em-estados/`**: Agente que mantém uma memória interna do mundo para decidir.
* **`workflows/baseado-em-objetivos/`**: Agente que simula planejamento/busca para atingir uma meta.
* **`workflows/aprende/`**: Agente que melhora seu desempenho com base em dados passados (Ex: feedback loop).

## 🚀 Como Rodar (Ambientação)

Este projeto utiliza **Docker** para garantir que todos rodem a mesma versão do n8n.

### Pré-requisitos
* Docker e Docker Compose instalados.

### Passo a Passo
1.  Na raiz do projeto, suba o container:
    ```bash
    docker compose up -d
    ```
2.  Acesse o editor do n8n no navegador:
    * **URL:** `http://localhost:5678`

> **Nota:** As credenciais (senhas de API, bancos de dados) não são salvas no Git. Você precisará configurá-las manualmente no seu n8n local se o fluxo exigir.

## 🤝 Como Colaborar (Git + n8n)

Como o n8n não possui versionamento nativo de arquivos, seguimos este fluxo para não