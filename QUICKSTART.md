# Quickstart – Operação Última Missão: Scheduler

## Objetivo

Criar uma aplicação web extremamente simples para ajudar um grupo de amigos a encontrar o melhor final de semana para uma viagem (despedida de solteiro).

O foco é ser um projeto **100% client-side**, sem backend próprio, utilizando **InstantDB** para persistência e sincronização em tempo real entre os usuários.

O repositório está vazio. Você deve criar toda a estrutura do projeto.

---

# Stack

* Svelte **5**
* Vite
* TypeScript
* Bun (utilizar Bun como runtime e gerenciador de pacotes durante todo o desenvolvimento)
* InstantDB
* HTML/CSS simples
* Sem SSR
* Sem backend próprio
* Mobile-first

Evite dependências desnecessárias.

A ideia é que o projeto inteiro seja pequeno, simples e fácil de manter.

## Requisitos obrigatórios do Svelte

Este projeto deve utilizar exclusivamente os recursos modernos do **Svelte 5**.

Isso significa:

* utilizar **Runes** (`$state`, `$derived`, `$effect`, etc.) sempre que apropriado;
* utilizar a nova API de componentes e reatividade;
* utilizar tipagem completa em TypeScript;
* seguir as recomendações mais atuais da documentação oficial do Svelte.

Por se tratar de um projeto novo (greenfield), **não utilize nenhuma sintaxe legada do Svelte 4**.

Em especial, não utilize:

* `export let`
* `$:`
* APIs marcadas como legacy pela documentação oficial

Caso exista uma forma moderna equivalente utilizando runes, ela deve ser preferida.

---

# Fluxo esperado

Ao acessar o site:

1. O usuário informa uma senha.
2. A senha é validada apenas no frontend.
3. Caso esteja correta, o usuário entra na aplicação.

Não é necessário nenhum tipo de segurança forte.

A senha existe apenas para:

* evitar bots;
* evitar curiosos;
* impedir acesso acidental.

---

# Identificação do participante

Inicialmente pensei em algo extremamente simples.

Na primeira visita:

> Digite seu nome

Esse nome fica salvo no LocalStorage.

Depois disso:

* reutilizamos sempre esse nome;
* existe um botão "Trocar nome", caso necessário.

A ideia é evitar completamente qualquer fluxo de cadastro.

Entretanto, sei que o **InstantDB possui suporte nativo para autenticação bastante simplificada**.

Caso você julgue que utilizar a autenticação nativa do InstantDB seja a melhor opção (por simplicidade de implementação, identificação consistente dos participantes e integração com o restante da aplicação), prefiro seguir esse caminho.

O objetivo é priorizar a simplicidade da experiência do usuário, não necessariamente evitar autenticação a qualquer custo.

Em resumo:

* se o login nativo do InstantDB praticamente resolver o problema "de graça", utilize-o;
* caso uma solução baseada apenas em LocalStorage seja mais simples e igualmente adequada, ela também atende perfeitamente aos objetivos do projeto.

Cada participante deve possuir apenas um voto por final de semana.

---

# Página principal

A página mostra um grid de cards.

Cada card representa um único final de semana.

Exemplo:

```text
Sex 29
Sáb 30
Dom 31
```

Cada card possui duas opções de voto.

### Opção 1

✅ Consigo chegar na sexta

(significa que participarei do final de semana inteiro)

### Opção 2

🟡 Só consigo chegar no sábado

(significa que participarei apenas parcialmente)

O usuário pode selecionar exatamente uma dessas opções para cada card.

Também pode deixar um card sem resposta.

---

# Feedback visual

Os cards devem mudar de cor conforme a quantidade de votos.

Quanto maior a disponibilidade, mais verde.

Quanto menor, mais neutro/cinza.

A ideia é que, ao abrir a aplicação, seja possível identificar visualmente quais finais de semana possuem maior aderência.

Não precisa ser nada sofisticado.

Um simples gradiente já resolve.

---

# Atualização em tempo real

Esse é um requisito importante.

Quando alguém votar:

* todos os outros navegadores devem atualizar automaticamente;
* nenhuma atualização manual deve ser necessária.

Quero aproveitar a sincronização em tempo real do InstantDB.

---

# Administração

Gostaria de existir um modo administrador.

Não precisa ser sofisticado.

Pode ser acessado por outra senha.

O administrador consegue:

* criar finais de semana;
* remover finais de semana;
* editar datas;
* reordenar cards (opcional).

Não existe necessidade de um CRUD complexo.

A ideia é configurar facilmente quais datas aparecem para votação.

---

# Estrutura dos dados

Minha ideia inicial seria algo semelhante a:

## Weekend

* id
* fridayDate
* saturdayDate
* sundayDate
* order

## Vote

* weekendId
* participantId
* arrivalType

Onde `arrivalType` pode assumir:

* friday
* saturday

Naturalmente, adapte essa modelagem caso exista uma abordagem mais adequada ao InstantDB.

---

# Visualização dos cards

Gostaria que os cards mostrassem algo semelhante a:

```text

SEX | SAB | DOM
29  | 30  | 31

██████████

6 pessoas chegam sexta

2 pessoas chegam sábado

[✓ Sexta]
[  Sábado]
```

Talvez uma barra simples indicando o nível de adesão.

Não precisa ser bonito.

Precisa ser claro.

Seria interessante que:

* a intensidade do verde refletisse a quantidade total de participantes disponíveis;
* fosse possível visualizar rapidamente quais datas estão "ganhando";
* opcionalmente houvesse um pequeno resumo com a quantidade de pessoas que chegam na sexta e naquelas que chegam apenas no sábado.

---

# Interface

Quero algo extremamente limpo.

Quase sem elementos.

Nada de animações exageradas.

Prioridades:

* rápido;
* simples;
* responsivo;
* excelente experiência em celular.

---

# Estilo

Visual moderno.

Cartões.

Cantos arredondados.

Poucas cores.

Muito espaço em branco.

Pode utilizar CSS puro.

Não há necessidade de Tailwind.

---

# InstantDB

Quero utilizar o InstantDB como única camada de persistência.

Gostaria que você conduzisse toda essa configuração.

Incluindo:

* criação do projeto;
* configuração da CLI;
* configuração do ambiente;
* modelagem do schema;
* sincronização em tempo real;
* deployment.

Assuma que nunca utilizei InstantDB.

Sempre explique rapidamente o motivo de cada decisão.

Sempre que houver alguma funcionalidade nativa do InstantDB que simplifique a implementação, prefira utilizá-la em vez de construir uma solução manual.

---

# Desenvolvimento

Gostaria que você conduzisse o desenvolvimento incrementalmente.

Não gere milhares de linhas de código de uma única vez.

Prefiro evoluir passo a passo.

Sugestão de sequência:

1. Criar o projeto utilizando Bun.
2. Configurar o InstantDB.
3. Validar uma conexão simples.
4. Modelar os dados.
5. Construir a tela principal.
6. Implementar os votos.
7. Implementar a sincronização em tempo real.
8. Implementar o painel administrativo.
9. Refinar a interface.

Sempre valide cada etapa antes de seguir para a próxima.

---

# Filosofia do projeto

Este projeto não pretende ser um sistema genérico de agendamento.

Ele existe apenas para resolver um problema específico de forma extremamente simples.

Sempre que existir mais de uma alternativa técnica, prefira a que:

* tenha menos código;
* seja mais simples de manter;
* aproveite recursos nativos do InstantDB;
* reduza a necessidade de backend próprio;
* ofereça a melhor experiência ao usuário final.

O objetivo é que qualquer pessoa consiga abrir um link, informar sua disponibilidade em poucos segundos e acompanhar, em tempo real, quais finais de semana possuem maior adesão do grupo.

Prefiro uma solução pequena, elegante e fácil de entender do que uma arquitetura excessivamente sofisticada para um projeto desse porte.
