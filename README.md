<p align="center"><img src="public/icon-256.png" width="96" alt=""></p>

<h1 align="center">Unfollow Control</h1>

<p align="center">
Descubra quem não te segue de volta no Instagram usando o export oficial do próprio Instagram.<br>
Sem senha, sem bot, sem servidor: tudo roda no seu computador.
</p>

<p align="center"><a href="#english">English below</a></p>

---

## Baixar

Vá em **[Releases](https://github.com/vipszsz/unfollow-control/releases/latest)** e escolha:

| Sistema | Arquivo | Como abrir |
|---|---|---|
| **Windows** | `UnfollowControl-x.y.z-portable.exe` | Um arquivo só, sem instalação. Dê dois cliques. |
| **Mac, Linux, outros** | `UnfollowControl-x.y.z.html` | Abra no Chrome, Edge ou Firefox. Não tem o painel do Instagram: os perfis abrem numa aba nova. |

**Aviso do Windows na primeira vez.** O app não tem assinatura digital (ela é paga), então o Windows mostra *"O Windows protegeu o computador"*. Clique em **Mais informações → Executar assim mesmo**. O código está todo aqui no repositório para quem quiser conferir.

No Windows, seus dados ficam numa pasta **Unfollow Control Data**, ao lado do `.exe`. Para apagar tudo, use *… → Apagar todos os dados* no app ou apague essa pasta.

## Como usar

1. **Exporte seus dados do Instagram.** Central de Contas → Suas informações e permissões → Exportar suas informações → Criar exportação → Exportar para o dispositivo. Em *Personalizar informações*, marque só **Seguidores e seguindo**. Escolha **Desde o início** e formato **JSON**. O app tem esse guia passo a passo em *Como exportar*.
2. **Arraste o `.zip`** que o Instagram enviar para o app. Não precisa descompactar.
3. **Revise:**
   - **Listas:** não me seguem, mútuos, me seguem e pendentes, 10 por página, com busca e atalhos (`J`/`K`, `O`, `X`).
   - **Modo swipe:** uma conta por vez. ← fila de unfollow, → manter, ↑ pular, `1` `2` `3` etiquetas, `Z` desfazer.
   - **Etiquetas:** Amigo, Talvez, Marca/Artista e Fila de unfollow.
   - **Fila de unfollow:** abre cada perfil no painel do Instagram. Você deixa de seguir lá e confirma no app. Tem meta diária.
   - **Histórico:** importe um export novo depois e veja quem deixou de te seguir.
   - **Buscar @conta:** veja sua relação com qualquer conta e quais contas que você segue seguem ela.

## Privacidade

- **O app não pede senha.** Ele lê só o arquivo que o Instagram te entrega.
- **Só o Instagram fica online.** O app em si é bloqueado para acessar a internet (`electron/main.cjs`). O painel do Instagram é uma sessão separada que só alcança domínios do Instagram e da Meta. O app não lê nem clica nada nessa página: quem deixa de seguir é você. *… → Sair do Instagram* apaga a sessão.
- **Nada é automatizado.** Nada de API não oficial nem de ações em massa. Por isso sua conta não corre o risco de ser bloqueada por comportamento de bot.

## Segurança

- **Baixe só daqui.** A versão oficial está apenas nos [Releases deste repositório](https://github.com/vipszsz/unfollow-control/releases). Cópias enviadas por outras pessoas ou outros sites não são verificadas.
- **O app nunca pede sua senha.** Se alguma versão pedir usuário e senha do Instagram fora da página do próprio Instagram, ela não é oficial. Não use.
- **Confira o arquivo (opcional).** Cada release traz um `SHA256SUMS.txt`. No Windows, rode no PowerShell `Get-FileHash .\UnfollowControl-1.0.0-portable.exe` e compare o resultado com o do arquivo. Se for diferente, o download foi alterado.

## Licença

[MIT](LICENSE). Qualquer pessoa pode usar, modificar e redistribuir o código. O software é fornecido "como está", sem garantia.

## Desenvolvimento

```bash
npm install
npm run dev        # app desktop com recarga automática
npm run dev:web    # só a interface, no navegador
npm run dist       # gera o .exe portátil e o HTML em release/
```

Feito com Vite, React, TypeScript, Motion e Electron. As animações seguem a skill [apple-design](https://github.com/emilkowalski/skills/blob/main/skills/apple-design/SKILL.md) de Emil Kowalski.

---

## English

**Unfollow Control** shows who doesn't follow you back on Instagram, using Instagram's own data export. No password, no bot, no server: everything runs on your computer.

- **Download** from [Releases](https://github.com/vipszsz/unfollow-control/releases/latest): the portable `.exe` for Windows, or `UnfollowControl-x.y.z.html` for any other system (no Instagram panel there; profiles open in a new tab). Windows will warn that the app is unsigned. Click *More info → Run anyway*.
- **Use:** export *Followers and following* from Instagram's Accounts Center as **JSON**, *All time*, and drop the `.zip` into the app. Then use the lists, swipe mode, labels, unfollow queue, history and account lookup. The app is in Portuguese and English.
- **Security:** only download from this repo's [Releases](https://github.com/vipszsz/unfollow-control/releases). The app never asks for your password; any copy that does is not official. Each release includes `SHA256SUMS.txt` to verify the files.
- **License:** [MIT](LICENSE), provided "as is", without warranty.
- **Privacy:** the app itself can't reach the network. The optional Instagram panel is a separate, sandboxed session limited to Instagram/Meta domains. You log in on Instagram's own page and unfollow yourself; the app never reads or clicks anything there.
