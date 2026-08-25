// READ: Retorna os dados para o Frontend
function doGet(e) {
  var dados = getDadosPlanilha();
  return ContentService
    .createTextOutput(JSON.stringify({ status: "success", data: dados }))
    .setMimeType(ContentService.MimeType.JSON);
}

// CREATE, UPDATE, DELETE: Recebe as requisições enviadas pelo site
function doPost(e) {
  try {
    // Lê o corpo da requisição enviada pelo fetch
    var request = JSON.parse(e.postData.contents);
    var action = request.action;
    var payload = request.data;
    var resultado;

    switch (action) {
      case "CRIAR_PROJETO":
        resultado = criarProjeto(payload);
        break;
        
      case "ATUALIZAR_TAREFA":
        resultado = atualizarTarefa(payload); // Ex: mudar status, datas
        break;
        
      case "EXCLUIR_TAREFA":
        resultado = excluirTarefa(payload.idTarefa);
        break;
        
      case "CRIAR_TAREFA":
        resultado = criarTarefa(payload);
        break;
        
      default:
        throw new Error("Ação não reconhecida: " + action);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", result: resultado }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (erro) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: erro.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
