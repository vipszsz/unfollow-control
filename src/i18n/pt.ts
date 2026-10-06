export const pt = {
  appName: 'Unfollow Control',
  win: { close: 'Fechar', minimize: 'Minimizar', maximize: 'Maximizar', restore: 'Restaurar' },
  nav: {
    notFollowingBack: 'Não me seguem',
    mutuals: 'Mútuos',
    fans: 'Me seguem',
    pending: 'Pendentes',
  },
  actions: {
    import: 'Importar zip',
    history: 'Histórico',
    swipe: 'Modo swipe',
    search: 'Buscar @conta…',
    more: 'Mais opções',
  },
  theme: { label: 'Tema', light: 'Claro', dark: 'Escuro' },
  lang: { label: 'Idioma' },
  locked: 'Importe um zip para liberar',
  soon: 'em breve',
  menu: {
    howTo: 'Como exportar do Instagram',
    github: 'Código no GitHub',
    wipe: 'Apagar todos os dados',
    wipeHint: 'Nada salvo ainda',
  },
  welcome: {
    eyebrow: 'privado · local · sem login',
    title: 'Quem não te segue de volta?',
    body: 'Importe o export oficial do Instagram e veja quem não te segue de volta, quem é mútuo e quais pedidos ficaram pendentes. Nada sai do seu computador.',
    drop: 'Arraste o zip do Instagram aqui',
    dropHint: 'ou clique para escolher o arquivo',
    howTo: 'Ainda não tem o zip? Veja como exportar',
  },
  privacy: {
    noLogin: { title: 'Sem login', body: 'Você nunca digita sua senha. O app lê só o arquivo que o próprio Instagram te entrega.' },
    offline: { title: 'Sem internet', body: 'O app é bloqueado para acessar a rede. Os perfis abrem no seu navegador.' },
    local: { title: 'Só no seu PC', body: 'Seus dados ficam numa pasta do app. Você apaga tudo quando quiser.' },
  },
}

export type Dict = typeof pt
