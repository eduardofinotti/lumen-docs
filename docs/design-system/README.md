# Lúmen

Evidência científica, em português, em segundos.

Lúmen é o buscador de artigos da mentoria Endogin: o médico pergunta como falaria com um colega e recebe uma resposta em português, sustentada por artigos reais do PubMed, com cada afirmação ligada à sua fonte. O nome vem da unidade de luz: a ferramenta ilumina a literatura, não substitui o julgamento de quem a lê.

## Princípios

1. **Luz, não ruído.** Uma coisa por tela. A caixa de pergunta é o único elemento central; tudo o mais é apoio.
2. **Calmo e confiável.** O público é médico, exigente, pouco familiarizado com tecnologia. Nada de visual de startup: sem gradientes, sem sombras pesadas, sem ícones decorativos, sem emoji.
3. **O laranja é um ponto de luz.** Uma única cor de marca (`lumen`), usada como a luz num ambiente neutro: botão primário, números de citação, foco. Nunca em blocos grandes nem em texto corrido.
4. **A fonte é a prova.** Toda resposta mostra de onde veio. Números de citação `[1]`, etiquetas de nível de evidência e links para o PubMed são elementos de primeira classe, não rodapé.
5. **Português do início ao fim.** Interface, resumos, etiquetas e mensagens de erro. Nenhum termo em inglês onde existe um em português.

## Voz e texto

- Fale com o médico como um colega bem lido falaria: direto, sem jargão de tecnologia, sem exclamações.
- Botões dizem o que acontece: "Pesquisar", "Copiar com referências", "Nova pesquisa".
- A resposta sempre termina com a frase: "A decisão clínica é do médico."
- Quando a evidência é fraca ou não existe, diga isso em uma linha, antes de qualquer síntese.
- Erros explicam o que fazer: "Não encontramos artigos para essa pergunta. Tente termos mais gerais ou amplie a data."
- O aviso de privacidade é fixo e curto: "Não insira dados que identifiquem o paciente."

## Cor

Fundo `surface` (off-white quente), texto `ink`, cards em `surface-raised` com borda `line`. O laranja `lumen` aparece em no máximo três lugares por tela. Texto sobre laranja é sempre `on-lumen` (escuro); branco sobre laranja reprova no contraste.

As etiquetas de nível de evidência usam `evidence-high`, `evidence-mid` e `evidence-low` sempre acompanhadas do texto ("Revisão sistemática", "Coorte", "Relato de caso"); a cor reforça, nunca substitui. `danger` é só para erro e para o aviso de dado de paciente; não confundir com a cor da marca.

Modo escuro: mesma hierarquia, fundos em grafite quente, laranja um tom mais claro (`lumen` escuro) para manter contraste.

## Tipografia

- **Fraunces** (display) nos títulos: a serifada dá o tom editorial e acadêmico. Peso 500, tracking levemente negativo. Só em `display-*`; nunca em texto corrido.
- **Geist** (sans) em tudo o mais: interface, resposta, metadados. Peso 400 para texto, 500 para títulos de card e botões.
- **Geist Mono** apenas para o PMID e para prompts copiáveis.
- Texto corrido em `body` (16/26) com largura máxima de 68 caracteres. Resumos de artigo em `body-sm`.
- Rótulos (`label`) em caixa alta com `letter-spacing` 0.08em, cor `ink-secondary`.

Fontes carregadas do Google Fonts (`Fraunces`, `Geist`, `Geist Mono`); no Next.js, via `next/font/google`.

## Espaço e forma

Escala de 4px. Cards e caixa de pergunta em `space-6` de padding e `radius-lg`. Botões e inputs em `radius-md`. Bordas de 1px em `line`; a única sombra é `shadow-sm`, na caixa de pergunta em repouso. Foco sempre visível com `shadow-focus`.

## Logo

A marca é um anel aberto com um ponto no centro: a abertura de uma lente e o ponto de luz. O anel abre no canto superior direito; não rotacione. Sempre em `lumen` sobre fundo neutro, ou em `ink` quando precisar de monocromia. Área de respiro: metade do diâmetro do anel em todos os lados. Tamanho mínimo: 20px (só o símbolo) e 96px de largura (wordmark).

Arquivos em `assets/Logos`:
- `lumen-mark.svg` e `lumen-mark-dark.svg`: só o símbolo.
- `lumen-wordmark.svg` e `lumen-wordmark-dark.svg`: símbolo + nome em Fraunces. O SVG referencia a fonte por nome; em ambientes sem Fraunces o texto cai para Georgia. Para uso em produção, converter o texto em curvas ou renderizar o nome em HTML ao lado do símbolo.
- `lumen-app-icon.svg`: ícone de app e favicon, sobre `ink`.

Não fazer: esticar, adicionar sombra ou gradiente, colocar sobre foto, usar o símbolo como ícone de "pesquisar" na interface.

## Iconografia

Ícones de traço (1.5px), estilo Lucide, em `ink-secondary`; ativos em `lumen`. Nunca ícones preenchidos coloridos. Um ícone por ação, sempre com texto ao lado nos botões.

## Componentes

- **Caixa de pergunta**: o elemento central. `surface-raised`, borda `line`, `radius-lg`, `shadow-sm`. Placeholder com uma pergunta clínica real. Seletor de data à direita, botão "Pesquisar" em `lumen`.
- **Botão**: primário em `lumen` com texto `on-lumen`; secundário com borda `line-strong` e texto `ink`; terciário só texto. Altura 44px.
- **Citação**: número entre colchetes em `lumen`, peso 500. Ao passar o mouse, o card do artigo correspondente ganha fundo `lumen-tint`.
- **Card de artigo**: título em `title`, metadados em `body-sm` `ink-secondary`, etiqueta de evidência, link "Ver no PubMed". PMID em mono.
- **Etiqueta de evidência**: pill `radius-sm`, texto `label`, cor por nível, fundo transparente com borda da mesma cor a 40%.
- **Sugestão de pergunta**: pill `radius-md`, borda `line`, texto `body-sm`; hover em `lumen-tint`.
- **Aviso de paciente**: linha única em `body-sm` `danger`, sem fundo, logo abaixo da caixa.
