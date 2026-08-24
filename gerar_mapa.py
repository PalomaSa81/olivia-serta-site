import os
import datetime

PROJECT_DIR = "."
IGNORE_DIRS = {'.git', '__pycache__', '.firebase'}
IGNORE_FILES = {'gerar_mapa.py', 'limpar.py', 'mapa_projeto.html'}

def get_file_details(filepath):
    stat = os.stat(filepath)
    size_kb = round(stat.st_size / 1024, 1)
    mtime = datetime.datetime.fromtimestamp(stat.st_mtime).strftime('%d/%m/%Y %H:%M')
    return size_kb, mtime

def scan_directory(path):
    structure = {'dirs': {}, 'files': []}
    try:
        items = sorted(os.listdir(path))
    except PermissionError:
        return structure

    for item in items:
        if item in IGNORE_DIRS or item in IGNORE_FILES:
            continue
        full_path = os.path.join(path, item)
        if os.path.isdir(full_path):
            structure['dirs'][item] = scan_directory(full_path)
        elif os.path.isfile(full_path):
            size, mtime = get_file_details(full_path)
            ext = item.split('.')[-1].upper() if '.' in item else 'ARQUIVO'
            structure['files'].append({
                'name': item,
                'path': full_path,
                'size': f"{size} KB" if size < 1024 else f"{round(size/1024, 1)} MB",
                'mtime': mtime,
                'ext': ext
            })
    return structure

data = scan_directory(PROJECT_DIR)

html_code = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mapa do Projeto — Olívia Sertã</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-color: #F6F4F0;
            --card-bg: #FFFFFF;
            --accent-green: #2C4A3E; 
            --accent-gold: #C2A675;  
            --text-dark: #1F2421;
            --text-muted: #656A67;
            --border-color: #E2DDD5;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{ background-color: var(--bg-color); color: var(--text-dark); font-family: 'Montserrat', sans-serif; padding: 40px 20px; line-height: 1.6; }}
        .container {{ max-width: 900px; margin: 0 auto; }}
        h1 {{ font-family: 'Cormorant Garamond', serif; font-size: 2.5rem; color: var(--accent-green); font-weight: 300; margin-bottom: 8px; }}
        p.subtitle {{ color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 30px; }}
        
        .card {{ background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 20px; }}
        
        .folder-title {{ font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; color: var(--accent-green); margin: 25px 0 10px 0; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 6px; }}
        
        .file-item {{ display: flex; align-items: center; justify-content: space-between; background: #FAFAFA; border: 1px solid var(--border-color); padding: 12px 18px; border-radius: 4px; margin: 8px 0; transition: transform 0.2s; }}
        .file-item:hover {{ border-color: var(--accent-gold); transform: translateX(4px); }}
        
        .file-left {{ display: flex; align-items: center; gap: 12px; }}
        .file-name {{ font-weight: 500; font-size: 0.95rem; color: var(--text-dark); text-decoration: none; }}
        .file-name:hover {{ color: var(--accent-gold); }}
        
        .file-badge {{ background: var(--accent-green); color: white; padding: 3px 8px; border-radius: 3px; font-size: 0.65rem; text-transform: uppercase; font-weight: 600; letter-spacing: 1px; }}
        .file-meta {{ display: flex; gap: 20px; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }}
        
        .subfolder {{ margin-left: 20px; border-left: 2px solid var(--border-color); padding-left: 15px; margin-top: 15px; }}
        
        .btn-refresh {{ display: inline-block; background: var(--accent-green); color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; margin-bottom: 25px; transition: background 0.3s; cursor: pointer; border: none; }}
        .btn-refresh:hover {{ background: var(--accent-gold); color: var(--text-dark); }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Mapa Visual do Projeto</h1>
        <p class="subtitle">Estrutura de diretórios, arquivos, tamanhos e datas</p>
        
        <button onclick="location.reload();" class="btn-refresh">🔄 Atualizar Mapa Agora</button>

        <div class="card">
"""

def render_structure(struct):
    res = ""
    for f in struct['files']:
        res += f"""
            <div class="file-item">
                <div class="file-left">
                    <span class="file-badge">{f['ext']}</span>
                    <a href="{f['name']}" target="_blank" class="file-name">{f['name']}</a>
                </div>
                <div class="file-meta">
                    <span>{f['size']}</span>
                    <span>{f['mtime']}</span>
                </div>
            </div>
        """
    
    for dirname, substruct in struct['dirs'].items():
        res += f"<div class='folder-title'>📁 {dirname}/</div>"
        res += f"<div class='subfolder'>"
        res += render_structure(substruct)
        res += f"</div>"
        
    return res

html_code += render_structure(data)
html_code += """
        </div>
    </div>
</body>
</html>
"""

with open("mapa_projeto.html", "w", encoding='utf-8') as f:
    f.write(html_code)

print("Mapa gerado com sucesso em mapa_projeto.html!")
