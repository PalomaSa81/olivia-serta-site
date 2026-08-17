import re

# Lê o arquivo com os botões
with open('site_em_construcao.html', 'r', encoding='utf-8') as f:
    conteudo = f.read()

# Remove todas as tags <a> que contêm a classe edit-btn
conteudo_limpo = re.sub(r'<a\s+[^>]*class="edit-btn"[^>]*>.*?</a>', '', conteudo, flags=re.DOTALL)

# Salva o resultado no index.html oficial
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(conteudo_limpo)

print("Sucesso! index.html gerado sem os botões.")
