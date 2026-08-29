/**
 * ==========================================================
 * HUB DE GESTÃO DE EVENTOS — BACKEND
 * Google Apps Script
 * ==========================================================
 *
 * PROJETO GAS SOLTO / STANDALONE
 *
 * Como este projeto NÃO está vinculado diretamente à planilha,
 * usamos SpreadsheetApp.openById() em vez de:
 *
 * SpreadsheetApp.getActiveSpreadsheet()
 *
 * ==========================================================
 */

/**
 * ==========================================================
 * CONFIGURAÇÃO DA PLANILHA
 * ==========================================================
 *
 * Cole abaixo o ID da sua planilha.
 *
 * Exemplo:
 * https://docs.google.com/spreadsheets/d/1AbCdEFgHIjKLMnOPqrStUVwxyz/edit
 *
 * ID:
 * 1AbCdEFgHIjKLMnOPqrStUVwxyz
 *
 */
const SPREADSHEET_ID = '1v0cMxtRn80-nyowIdVLmp18Ws8uKaPRQg3oPjCiL_TM';

/**
 * Abre explicitamente a planilha usada como banco de dados.
 *
 * IMPORTANTE:
 * Não usamos getActiveSpreadsheet(), pois este projeto é solto.
 */
const SS = SpreadsheetApp.openById(SPREADSHEET_ID);

/**
 * ==========================================================
 * CHAVES PRIMÁRIAS
 * ==========================================================
 *
 * Nome da coluna que identifica unicamente cada registro.
 */
const CHAVES_PRIMARIAS = {
  'Projetos': 'ID_Projeto (PK)',
  'Catalogo_Tarefas': 'ID_Tarefa',
  'Cronograma_Roteiro': 'ID_Item_Roteiro (PK)',
  'Itens_Cenografia_Infra': 'ID_Item (PK)',
  'Escalas_Trabalhadores': 'ID_Escala (PK)',
  'Status_Trabalho_Assistente': 'ID_Status (PK)',
  'Notas_Referencias': 'ID_Nota (PK)',
  'Drive_Novidades_Log': 'ID_Log (PK)',
  'Tarefas_Ativas': 'ID_Tarefa (PK)',
  'Usuarios': 'ID_Usuario (PK)',
  'Fornecedores_Equipe': 'ID_Fornecedor (PK)',
  'Legislacao_Normas': 'ID_Norma (PK)',
  'Registro_Horas_Invisiveis': 'ID_Registro (PK)',
  'Logs_Sessao': 'ID_Sessao (PK)'
};

/**
 * ==========================================================
 * GET — Roteador de Interface HTML e Requisições API
 * ==========================================================
 */
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : null;

    // Se o frontend solicitar dados via API (?action=getAll)
    if (action === 'getAll') {
      const resultado = getDadosPlanilha();
      return responder({
        status: 'success',
        data: resultado
      });
    }

    // Acesso direto via navegador: carrega a página HTML (Index.html)
    return HtmlService.createTemplateFromFile('Index')
      .evaluate()
      .setTitle('Hub de Gestão de Eventos')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');

  } catch (erro) {
    return responder({
      status: 'error',
      message: String(erro)
    });
  }
}

/**
 * ==========================================================
 * POST
 * ==========================================================
 *
 * Ações suportadas:
 * insert
 * update
 * delete
 * CRIAR_PROJETO_COM_TAREFAS
 *
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Nenhum dado recebido no POST.');
    }

    const request = JSON.parse(e.postData.contents);
    const action = request.action;
    const aba = request.sheet;
    const payload = request.data || {};

    let resultado;

    switch (action) {
      case 'insert':
        validarAbaInformada(aba);
        resultado = inserirLinha(aba, payload);
        break;

      case 'update':
        validarAbaInformada(aba);
        resultado = atualizarLinha(aba, payload);
        break;

      case 'delete':
        validarAbaInformada(aba);
        resultado = excluirLinha(aba, payload);
        break;

      case 'CRIAR_PROJETO_COM_TAREFAS':
        resultado = criarProjetoComTarefas(payload);
        break;

      default:
        throw new Error('Ação não reconhecida: ' + action);
    }

    return responder({
      status: 'success',
      result: resultado
    });
  } catch (erro) {
    console.error(erro);

    return responder({
      status: 'error',
      message: String(erro)
    });
  }
}

/**
 * ==========================================================
 * RESPOSTA JSON
 * ==========================================================
 */
function responder(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ==========================================================
 * LEITURA COMPLETA DO BANCO
 * ==========================================================
 *
 * Lê todas as abas da planilha.
 *
 * Retorno:
 * {
 *   Projetos: [...],
 *   Tarefas_Ativas: [...],
 *   Cronograma_Roteiro: [...],
 *   ...
 * }
 *
 */
function getDadosPlanilha() {
  const abas = SS.getSheets();
  const dados = {};

  abas.forEach(function(sheet) {
    const nomeAba = sheet.getName();
    dados[nomeAba] = lerAbaComoObjetos(sheet);
  });

  return dados;
}

/**
 * ==========================================================
 * CONVERTE UMA ABA EM ARRAY DE OBJETOS
 * ==========================================================
 */
function lerAbaComoObjetos(sheet) {
  const ultimaLinha = sheet.getLastRow();
  const ultimaColuna = sheet.getLastColumn();

  if (ultimaLinha < 2 || ultimaColuna < 1) {
    return [];
  }

  const valores = sheet.getRange(1, 1, ultimaLinha, ultimaColuna).getValues();
  const cabecalho = valores[0];
  const linhas = valores.slice(1);

  return linhas
    .filter(function(linha) {
      return linha.some(function(celula) {
        return celula !== '' && celula !== null;
      });
    })
    .map(function(linha) {
      const obj = {};

      cabecalho.forEach(function(coluna, i) {
        let valor = linha[i];

        if (valor instanceof Date) {
          valor = Utilities.formatDate(
            valor,
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          );
        }

        obj[coluna] = valor;
      });

      return obj;
    });
}

/**
 * ==========================================================
 * VALIDAÇÃO DE ABA
 * ==========================================================
 */
function validarAbaInformada(nomeAba) {
  if (!nomeAba) {
    throw new Error('Nenhuma aba foi informada.');
  }
}

/**
 * ==========================================================
 * OBTÉM UMA ABA
 * ==========================================================
 */
function pegarAba(nomeAba) {
  const sheet = SS.getSheetByName(nomeAba);

  if (!sheet) {
    throw new Error('Aba não encontrada na planilha: ' + nomeAba);
  }

  return sheet;
}

/**
 * ==========================================================
 * GERA ID ÚNICO
 * ==========================================================
 */
function gerarId(prefixo) {
  const timestamp = new Date().getTime();
  const aleatorio = Math.floor(Math.random() * 100000);

  return prefixo + '-' + timestamp + '-' + aleatorio;
}

/**
 * ==========================================================
 * ENCONTRA LINHA POR CHAVE PRIMÁRIA
 * ==========================================================
 */
function encontrarLinhaPorPK(sheet, colunaPK, valorPK) {
  const ultimaLinha = sheet.getLastRow();
  const ultimaColuna = sheet.getLastColumn();

  if (ultimaLinha < 2) {
    return null;
  }

  const dados = sheet.getRange(1, 1, ultimaLinha, ultimaColuna).getValues();
  const cabecalho = dados[0];
  const indicePK = cabecalho.indexOf(colunaPK);

  if (indicePK === -1) {
    throw new Error('Coluna de chave primária não encontrada: ' + colunaPK);
  }

  for (let i = 1; i < dados.length; i++) {
    if (String(dados[i][indicePK]) === String(valorPK)) {
      return {
        linha: i + 1,
        cabecalho: cabecalho
      };
    }
  }

  return null;
}

/**
 * ==========================================================
 * INSERT
 * ==========================================================
 */
function inserirLinha(nomeAba, dados) {
  const sheet = pegarAba(nomeAba);
  const ultimaColuna = sheet.getLastColumn();

  if (ultimaColuna < 1) {
    throw new Error('A aba não possui cabeçalho: ' + nomeAba);
  }

  const cabecalho = sheet.getRange(1, 1, 1, ultimaColuna).getValues()[0];
  const colunaPK = CHAVES_PRIMARIAS[nomeAba];

  if (colunaPK && !dados[colunaPK]) {
    dados[colunaPK] = gerarId(nomeAba.substring(0, 3).toUpperCase());
  }

  /**
   * Preenche Data_Criacao automaticamente,
   * caso a coluna exista.
   */
  if (cabecalho.indexOf('Data_Criacao') > -1 && !dados['Data_Criacao']) {
    dados['Data_Criacao'] = new Date();
  }

  const linha = cabecalho.map(function(coluna) {
    return dados[coluna] !== undefined ? dados[coluna] : '';
  });

  sheet.appendRow(linha);

  return dados;
}

/**
 * ==========================================================
 * UPDATE
 * ==========================================================
 */
function atualizarLinha(nomeAba, dados) {
  const sheet = pegarAba(nomeAba);
  const colunaPK = CHAVES_PRIMARIAS[nomeAba];

  if (!colunaPK) {
    throw new Error('Chave primária não mapeada para a aba: ' + nomeAba);
  }

  const valorPK = dados[colunaPK];

  if (valorPK === undefined || valorPK === null || valorPK === '') {
    throw new Error('Valor da chave primária não informado: ' + colunaPK);
  }

  const info = encontrarLinhaPorPK(sheet, colunaPK, valorPK);

  if (!info) {
    throw new Error(
      'Registro não encontrado para atualizar. ' + colunaPK + ': ' + valorPK
    );
  }

  /**
   * Atualiza apenas os campos enviados pelo frontend.
   */
  info.cabecalho.forEach(function(coluna, i) {
    if (Object.prototype.hasOwnProperty.call(dados, coluna)) {
      sheet.getRange(info.linha, i + 1).setValue(dados[coluna]);
    }
  });

  return dados;
}

/**
 * ==========================================================
 * DELETE
 * ==========================================================
 */
function excluirLinha(nomeAba, dados) {
  const sheet = pegarAba(nomeAba);
  const colunaPK = CHAVES_PRIMARIAS[nomeAba];

  if (!colunaPK) {
    throw new Error('Chave primária não mapeada para a aba: ' + nomeAba);
  }

  const valorPK = dados[colunaPK];

  if (valorPK === undefined || valorPK === null || valorPK === '') {
    throw new Error(
      'Valor da chave primária não informado para exclusão: ' + colunaPK
    );
  }

  const info = encontrarLinhaPorPK(sheet, colunaPK, valorPK);

  if (!info) {
    throw new Error('Registro não encontrado para excluir: ' + valorPK);
  }

  sheet.deleteRow(info.linha);

  return {
    excluido: valorPK
  };
}

/**
 * ==========================================================
 * CRIA PROJETO + TAREFAS
 * ==========================================================
 *
 * Recebe:
 * {
 *   projeto: {...},
 *   tarefas: [...]
 * }
 *
 * Gera o ID do projeto, salva o projeto
 * e vincula todas as tarefas a ele.
 *
 */
function criarProjetoComTarefas(payload) {
  const projeto = payload.projeto || {};
  const tarefas = payload.tarefas || [];

  if (!projeto.Nome_Projeto) {
    throw new Error('O nome do projeto é obrigatório.');
  }

  const idProjeto = gerarId('PRJ');

  projeto['ID_Projeto (PK)'] = idProjeto;

  inserirLinha('Projetos', projeto);


  tarefas.forEach(function(tarefa) {
    tarefa['ID_Projeto (FK)'] = idProjeto;

    if (!tarefa.Status) {
      tarefa.Status = 'Pendente';
    }

    inserirLinha('Tarefas_Ativas', tarefa);
  });


  return {
    idProjeto: idProjeto,
    totalTarefas: tarefas.length,
    projeto: projeto
  };
}

/**
 * ==========================================================
 * TESTE MANUAL
 * ==========================================================
 *
 * Execute esta função pelo editor do Apps Script
 * para verificar se o script consegue abrir a planilha.
 *
 */
function testarConexaoPlanilha() {
  const nome = SS.getName();
  const id = SS.getId();
  const abas = SS.getSheets().map(function(sheet) {
    return sheet.getName();
  });

  Logger.log({
    status: 'success',
    planilha: nome,
    id: id,
    abas: abas
  });

  return {
    status: 'success',
    planilha: nome,
    id: id,
    abas: abas
  };
}

function include(filename) {
  return HtmlService.createTemplateFromFile(filename).getRawContent();
}
