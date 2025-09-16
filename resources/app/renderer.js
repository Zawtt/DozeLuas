document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DE TROCA DE ABAS ---
    function setupTabs() {
        const tabContainers = document.querySelectorAll('.tab-container');
        tabContainers.forEach(container => {
            const tabButtons = container.querySelectorAll('.tab-button');
            const tabPanes = container.querySelectorAll('.tab-pane');
            tabButtons.forEach(button => {
                button.addEventListener('click', () => {
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    tabPanes.forEach(pane => pane.classList.remove('active'));
                    button.classList.add('active');
                    const targetTabId = button.dataset.tab;
                    const targetPane = container.querySelector(`#${targetTabId}`);
                    if (targetPane) { targetPane.classList.add('active'); }
                });
            });
        });
    }

    // --- VARIÁVEIS GLOBAIS E MAPEAMENTO ---
    const RECURSO_MAP = {'hp': 'HP', 'vida': 'HP', 'pv': 'HP', 'mana': 'Mana', 'aura': 'Aura', 'er': 'ER', 'en': 'EN', 'ep': 'EP', 'ea': 'EA'};
    let habilidades = [];
    let editIndex = null;
    let itemParaExcluirIndex = null;
    let novosValores = {};
    let caminhoImagemAtual = null;
    let debuffsAtivos = new Set(); 

    // --- REFERÊNCIAS AOS ELEMENTOS DO DOM ---
    const entradaDados = document.getElementById('entrada-dados');
    const btnRolar = document.getElementById('btn-rolar');
    const historicoRolagens = document.getElementById('historico-rolagens');
    const gridRolagensRapidas = document.getElementById('grid-rolagens-rapidas');
    const diceAnimation = document.getElementById('dice-animation');
    const listaHabilidadesContainer = document.getElementById('lista-habilidades-container');
    const btnAddHabilidade = document.getElementById('btn-add-habilidade');
    const modalHabilidadeOverlay = document.getElementById('modal-habilidade-overlay');
    const modalHabilidadeTitulo = document.getElementById('modal-habilidade-titulo');
    const habilidadeTituloInput = document.getElementById('habilidade-titulo-input');
    const habilidadeCustoInput = document.getElementById('habilidade-custo-input');
    const habilidadeDescricaoInput = document.getElementById('habilidade-descricao-input');
    const btnSalvarHabilidade = document.getElementById('btn-salvar-habilidade');
    const btnCancelarHabilidade = document.getElementById('btn-cancelar-habilidade');
    const modalConfirmOverlay = document.getElementById('modal-confirm-overlay');
    const confirmModalTexto = document.getElementById('confirm-modal-texto');
    const btnConfirmSim = document.getElementById('btn-confirm-sim');
    const btnConfirmNao = document.getElementById('btn-confirm-nao');
    const btnSalvar = document.getElementById('btn-salvar');
    const btnCarregar = document.getElementById('btn-carregar');
    const btnCarregarImagem = document.getElementById('btn-carregar-imagem');
    const imagemPlaceholder = document.getElementById('imagem-placeholder');
    const entradaRecursos = document.getElementById('entrada-recursos');
    const btnCalcular = document.getElementById('btn-calcular');
    const labelPreview = document.getElementById('label-preview');
    const btnConfirmar = document.getElementById('btn-confirmar');
    const textoAnotacoes = document.getElementById('texto-anotacoes');
    const gridDebuffs = document.getElementById('grid-debuffs');
    const debuffsAtivosContainer = document.getElementById('debuffs-ativos-container');
    
    // --- FUNÇÕES DE LÓGICA ---
    function rolarDados(expressao) {
        const matchPadrao = expressao.toLowerCase().trim().match(/(\d*)?d(\d+)([+-]\d+)?/);
        if (!matchPadrao) return "Formato inválido.";
        const numDados = parseInt(matchPadrao[1] || '1', 10), tipoDado = parseInt(matchPadrao[2], 10), modificador = parseInt(matchPadrao[3] || '0', 10);
        if (numDados > 100) return "Máximo de 100 dados.";
        let rolagens = Array.from({length: numDados}, () => Math.floor(Math.random() * tipoDado) + 1);
        const somaRolagens = rolagens.reduce((a, b) => a + b, 0), resultadoFinal = somaRolagens + modificador;
        if (numDados === 1) { return `${expressao}  >  ${resultadoFinal}`; }
        else { return `${expressao} > [${rolagens.join(', ')}] = ${resultadoFinal}`; }
    }

    function adicionarAoHistorico(texto) {
        const novaRolagem = document.createElement('div');
        novaRolagem.className = 'entrada-historico';
        novaRolagem.innerText = texto;
        historicoRolagens.prepend(novaRolagem);
    }
    
    function executarRolagem(expressao) {
        if (!expressao || btnRolar.disabled) return;
        historicoRolagens.classList.add('hidden');
        diceAnimation.classList.remove('hidden');
        btnRolar.disabled = true;
        document.querySelectorAll('.btn-dado').forEach(btn => btn.disabled = true);
        setTimeout(() => {
            const resultado = rolarDados(expressao);
            adicionarAoHistorico(resultado);
            entradaDados.value = '';
            historicoRolagens.classList.remove('hidden');
            diceAnimation.classList.add('hidden');
            btnRolar.disabled = false;
            document.querySelectorAll('.btn-dado').forEach(btn => btn.disabled = false);
        }, 1800);
    }
    
    function renderizarHabilidades() {
        listaHabilidadesContainer.innerHTML = '';
        habilidades.forEach((habilidade, index) => {
            const card = document.createElement('div');
            card.className = 'habilidade-card';
            card.innerHTML = `<h4>${habilidade.titulo}</h4><p class="custo">Custo: ${habilidade.custo}</p><p class="descricao">${habilidade.descricao.replace(/\n/g, '<br>')}</p><div class="habilidade-botoes"><button class="btn btn-editar" data-index="${index}"><img src="icons/edit.png" class="icon">Editar</button><button class="btn btn-excluir" data-index="${index}"><img src="icons/trash.png" class="icon">Excluir</button></div>`;
            listaHabilidadesContainer.appendChild(card);
        });
    }
    
    function abrirModalHabilidade(habilidade = null, index = null) {
        editIndex = index;
        if (habilidade) {
            modalHabilidadeTitulo.innerText = "Editar Habilidade";
            habilidadeTituloInput.value = habilidade.titulo;
            habilidadeCustoInput.value = habilidade.custo;
            habilidadeDescricaoInput.value = habilidade.descricao;
        } else {
            modalHabilidadeTitulo.innerText = "Nova Habilidade";
            habilidadeTituloInput.value = ""; habilidadeCustoInput.value = ""; habilidadeDescricaoInput.value = "";
        }
        modalHabilidadeOverlay.classList.remove('hidden');
    }

    function fecharModalHabilidade() { modalHabilidadeOverlay.classList.add('hidden'); }
    
    function abrirModalConfirmacao(index) {
        itemParaExcluirIndex = index;
        confirmModalTexto.innerText = `Tem certeza que deseja excluir a habilidade "${habilidades[index].titulo}"?`;
        modalConfirmOverlay.classList.remove('hidden');
    }

    function fecharModalConfirmacao() { modalConfirmOverlay.classList.add('hidden'); }

    function exibirImagem(caminho) {
        imagemPlaceholder.innerHTML = '';
        imagemPlaceholder.style.border = 'none';
        const imgElement = document.createElement('img');
        imgElement.src = `file://${caminho}`; 
        imagemPlaceholder.appendChild(imgElement);
    }
    
    function parseRecursos(textoInput) {
        const padrao = /([+-])?\s*(\d+)\s*([a-zA-Z]+)/g;
        let operacoes = []; let match;
        while ((match = padrao.exec(textoInput.toLowerCase())) !== null) {
            const [_, sinal, valorStr, recursoRaw] = match;
            const recursoOficial = RECURSO_MAP[recursoRaw];
            if (recursoOficial) { operacoes.push({ op: sinal || '-', val: parseInt(valorStr, 10), res: recursoOficial }); }
        }
        return operacoes;
    }

    function renderizarDebuffsAtivos() {
        debuffsAtivosContainer.innerHTML = '';
        debuffsAtivos.forEach(debuffNome => {
            const debuffElement = document.createElement('div');
            debuffElement.className = 'debuff-ativo';
            debuffElement.textContent = debuffNome;
            debuffElement.dataset.debuff = debuffNome;
            debuffsAtivosContainer.appendChild(debuffElement);
        });
        document.querySelectorAll('#grid-debuffs .btn-dado').forEach(button => {
            if (debuffsAtivos.has(button.dataset.debuff)) {
                button.classList.add('debuff-on');
            } else {
                button.classList.remove('debuff-on');
            }
        });
    }

    function toggleDebuff(debuffNome) {
        if (debuffsAtivos.has(debuffNome)) {
            debuffsAtivos.delete(debuffNome);
        } else {
            debuffsAtivos.add(debuffNome);
        }
        renderizarDebuffsAtivos();
    }
    
    // --- EVENT LISTENERS ---
    
    setupTabs();

    btnRolar.addEventListener('click', () => { if (entradaDados.value) { executarRolagem(entradaDados.value); } });
    gridRolagensRapidas.addEventListener('click', (e) => { if (e.target.classList.contains('btn-dado')) { executarRolagem(`1${e.target.textContent}`); } });
    
    btnAddHabilidade.addEventListener('click', () => abrirModalHabilidade());
    btnCancelarHabilidade.addEventListener('click', fecharModalHabilidade);
    modalHabilidadeOverlay.addEventListener('click', (e) => { if (e.target === modalHabilidadeOverlay) fecharModalHabilidade(); });

    btnSalvarHabilidade.addEventListener('click', () => {
        const novaHabilidade = { titulo: habilidadeTituloInput.value, custo: habilidadeCustoInput.value, descricao: habilidadeDescricaoInput.value };
        if (!novaHabilidade.titulo) {
            alert("O título da habilidade é obrigatório!");
            return;
        }
        if (editIndex !== null) { habilidades[editIndex] = novaHabilidade; } 
        else { habilidades.push(novaHabilidade); }
        renderizarHabilidades();
        fecharModalHabilidade();
    });

    listaHabilidadesContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const index = button.dataset.index;
        if (button.classList.contains('btn-editar')) { abrirModalHabilidade(habilidades[index], index); } 
        else if (button.classList.contains('btn-excluir')) { abrirModalConfirmacao(index); }
    });
    
    btnConfirmNao.addEventListener('click', fecharModalConfirmacao);
    modalConfirmOverlay.addEventListener('click', (e) => { if (e.target === modalConfirmOverlay) fecharModalConfirmacao(); });
    
    btnConfirmSim.addEventListener('click', () => {
        if (itemParaExcluirIndex !== null) {
            habilidades.splice(itemParaExcluirIndex, 1);
            renderizarHabilidades();
            fecharModalConfirmacao();
            itemParaExcluirIndex = null;
        }
    });

    btnCarregarImagem.addEventListener('click', async () => {
        const resultado = await window.electronAPI.carregarImagem();
        if (resultado.success) {
            caminhoImagemAtual = resultado.filePath;
            exibirImagem(caminhoImagemAtual);
        }
    });
    
    btnSalvar.addEventListener('click', async () => {
        const dadosFicha = {};
        const inputs = document.querySelectorAll('#ficha-principal input');
        inputs.forEach(input => {
            if (input.id) {
                if (input.type === 'checkbox') { dadosFicha[input.id] = input.checked; } 
                else { dadosFicha[input.id] = input.value; }
            }
        });
        dadosFicha['anotacoes'] = textoAnotacoes.value;
        dadosFicha['habilidades'] = habilidades;
        dadosFicha['caminhoImagem'] = caminhoImagemAtual;
        dadosFicha['debuffsAtivos'] = Array.from(debuffsAtivos); // Salva os debuffs
        
        const resultado = await window.electronAPI.salvarFicha(dadosFicha);
        if (resultado.success) { alert(`Ficha salva com sucesso em: ${resultado.path}`); } 
        else { if(resultado.error) alert(`Erro ao salvar: ${resultado.error}`); }
    });

    btnCarregar.addEventListener('click', async () => {
        const resultado = await window.electronAPI.carregarFicha();
        if (resultado.success) {
            const dadosFicha = resultado.data;
            for (const id in dadosFicha) {
                const campo = document.getElementById(id);
                if (campo) {
                    if (campo.type === 'checkbox') { campo.checked = dadosFicha[id]; } 
                    else { campo.value = dadosFicha[id]; }
                }
            }
            textoAnotacoes.value = dadosFicha['anotacoes'] || '';
            habilidades = dadosFicha['habilidades'] || [];
            renderizarHabilidades();
            if (dadosFicha.caminhoImagem) {
                caminhoImagemAtual = dadosFicha.caminhoImagem;
                exibirImagem(caminhoImagemAtual);
            }
            // Carrega os debuffs
            debuffsAtivos = new Set(dadosFicha['debuffsAtivos'] || []);
            renderizarDebuffsAtivos();
            
            alert("Ficha carregada com sucesso!");
        } else { if(resultado.error) alert(`Erro ao carregar: ${resultado.error}`); }
    });

    btnCalcular.addEventListener('click', () => {
        novosValores = {};
        const operacoes = parseRecursos(entradaRecursos.value);
        if (operacoes.length === 0) { labelPreview.innerText = "Formato inválido."; btnConfirmar.disabled = true; return; }
        let previewText = ""; let podeConfirmar = true;
        operacoes.forEach(item => {
            const campo = document.getElementById(item.res);
            if (!campo) { previewText += `${item.res}: Campo não encontrado!\n`; podeConfirmar = false; return; }
            try {
                const valorAtual = parseInt(campo.value || "0", 10);
                const novoValor = item.op === '+' ? valorAtual + item.val : valorAtual - item.val;
                novosValores[item.res] = novoValor;
                previewText += `${item.res} (${item.op}): ${valorAtual} -> ${novoValor}`;
                if (item.op === '-' && novoValor < 0) { previewText += " (INSUFICIENTE!)\n"; podeConfirmar = false; } else { previewText += "\n"; }
            } catch { previewText += `${item.res}: Valor inválido na ficha!\n`; podeConfirmar = false; }
        });
        labelPreview.innerText = previewText.trim();
        btnConfirmar.disabled = !podeConfirmar;
    });

    btnConfirmar.addEventListener('click', () => {
        for (const recurso in novosValores) {
            const campo = document.getElementById(recurso);
            if (campo) { campo.value = novosValores[recurso]; }
        }
        entradaRecursos.value = ""; labelPreview.innerText = "---"; btnConfirmar.disabled = true;
    });

    gridDebuffs.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-dado')) {
            toggleDebuff(e.target.dataset.debuff);
        }
    });
});