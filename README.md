# Carometro Escolar (DEMO)

Aplicacao de demonstracao para consulta de estudantes e captura visual local de fotos.

## Regra principal do projeto

Este projeto e somente DEMO.

- Nenhuma foto e enviada para R2.
- Nenhuma foto e persistida no banco.
- A imagem capturada fica apenas no navegador e pode desaparecer ao recarregar a pagina.

As rotas de upload da API retornam bloqueio permanente para evitar qualquer escrita real em storage ou banco, mesmo com chamada manual.

## Politica de dados

Este repositorio nao utiliza seed automatica.

- Nao existe `prisma db seed` configurado.
- Nao existe script de seed no fluxo oficial de desenvolvimento/deploy.
- O ambiente demo utiliza credenciais publicas para facilitar o acesso.

## Requisitos

- Node.js 20+
- NPM
- Banco configurado para leitura da lista de estudantes

## Variaveis de ambiente

Configure `.env.local` para sessao, banco e chaves ja utilizadas pelo projeto.

Importante: o comportamento demo nao depende de flag em `.env`; ele e permanente por regra de produto.

## Fluxo de foto em DEMO

1. Usuario abre a camera e captura uma foto.
2. A foto e exibida localmente na interface.
3. Nao ocorre requisicao de upload persistente.
4. Ao atualizar a pagina, o estado local e perdido.

## Deploy aberto ao publico

Para deploy publico, nao ha etapa adicional para bloquear upload: o bloqueio ja faz parte do codigo.

Checklist recomendado:

1. Validar login e carregamento da lista de estudantes.
2. Validar captura de foto local (sem persistencia apos refresh).
3. Validar que endpoints de upload retornam bloqueio (403).
4. Validar `npm run lint` sem erros.
5. Validar `npm run build` sem erros.
