# Relatório — v2.6.0 Etapa 4.1: Reorganização do Editor Visual

## Motivo da correção

A auditoria visual em resolução de notebook mostrou que o Editor Visual ultrapassava a largura útil do painel, criava rolagem horizontal e afastava a prévia dos controles. Isso dificultava alterar um bloco e conferir o resultado em tempo real.

## Alterações aplicadas

- remoção da duplicação do título “Editor Visual” dentro da área de trabalho;
- faixa superior compacta com versão, orientação e acesso à prévia em tela cheia;
- três áreas proporcionais em desktop: modelos/blocos, controles e prévia;
- prévia fixa abaixo da barra superior;
- rolagem independente para a lista de controles;
- lista de blocos compactada sem retirar setas, ativação ou arrastar;
- seleção do bloco também ao clicar nos botões de reordenação, sem impedir o funcionamento do interruptor;
- adaptação para notebook, tablet e celular;
- eliminação da rolagem horizontal geral nas resoluções testadas;
- prévia atualizada imediatamente ao alterar títulos, opções, cores e dispositivos.

## Resoluções auditadas

- 1600 × 900;
- 1360 × 768;
- 1180 × 800;
- 1024 × 768.

## Resultado dos testes

| Bateria | Resultado |
|---|---:|
| Etapa 4 — imagens | 39/39 |
| Regressão Etapa 1 | 48/48 |
| Regressão Etapa 2 | 46/46 |
| Regressão Etapa 3 | 56/56 |
| Correção 4.1 — layout | 42/42 |
| **Total** | **231/231** |

- falhas: **0**;
- exceções JavaScript: **0**;
- erros relevantes de console: **0**.

## Isolamento

- Worker alterado: **não**;
- D1 alterado: **não**;
- outros repositórios alterados: **não**;
- `config.js` alterado: **não**;
- manifesto alterado: **não**;
- endpoints adicionados: **0**;
- endpoints removidos: **0**;
- schema interno: **12**, preservado;
- migração SQL: **não necessária**.

Release interna: `2.6.0-stage4.1`.
