document.addEventListener('DOMContentLoaded', () => {
    
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

    // --- VARIÁVEIS GLOBAIS ---
    let habilidades = [];
    let inventario = [];
    let debuffsAtivos = [];
    let editIndex = null;
    let itemParaExcluir = null;
    let novosValores = {};
    let caminhoImagemAtual = null;

    // --- REFERÊNCIAS AO DOM ---
    const listaHabilidadesContainer = document.getElementById('lista-habilidades-container');
    const btnAddHabilidade = document.getElementById('btn-add-habilidade');
    const modalHabilidadeOverlay = document.getElementById('modal-habilidade-overlay');
    const modalHabilidadeTitulo = document.getElementById('modal-habilidade-titulo');
    const habilidadeTituloInput = document.getElementById('habilidade-titulo-input');
    const habilidadeCustoInput = document.getElementById('habilidade-custo-input');
    const habilidadeTurnosInput = document.getElementById('habilidade-turnos-input');
    const habilidadeDescricaoInput = document.getElementById('habilidade-descricao-input');
    const btnSalvarHabilidade = document.getElementById('btn-salvar-habilidade');
    const btnCancelarHabilidade = document.getElementById('btn-cancelar-habilidade');
    // ... (outras referências)
    const entradaDados = document.getElementById('entrada-dados');
    const btnRolar = document.getElementById('btn-rolar');
    const historicoRolagens = document.getElementById('historico-rolagens');
    const gridRolagensRapidas = document.getElementById('grid-rolagens-rapidas');
    const diceAnimation = document.getElementById('dice-animation');
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
    const listaInventarioContainer = document.getElementById('lista-inventario-container');
    const btnAddItem = document.getElementById('btn-add-item');
    const itemNomeInput = document.getElementById('item-nome-input');
    const itemQtdInput = document.getElementById('item-qtd-input');
    const debuffsAtivosContainer = document.getElementById('debuffs-ativos-container');
    const debuffNomeInput = document.getElementById('debuff-nome-input');
    const debuffTurnosInput = document.getElementById('debuff-turnos-input');
    const btnAddDebuff = document.getElementById('btn-add-debuff');
    const RECURSO_MAP = {'hp': 'HP', 'vida': 'HP', 'pv': 'HP', 'mana': 'Mana', 'aura': 'Aura', 'er': 'ER', 'en': 'EN', 'ep': 'EP', 'ea': 'EA'};
    
    function rolarDados(expressao){const matchPadrao=expressao.toLowerCase().trim().match(/(\d*)?d(\d+)([+-]\d+)?/);if(!matchPadrao)return"Formato inválido.";const numDados=parseInt(matchPadrao[1]||"1",10),tipoDado=parseInt(matchPadrao[2],10),modificador=parseInt(matchPadrao[3]||"0",10);if(numDados>100)return"Máximo de 100 dados.";let rolagens=Array.from({length:numDados},()=>Math.floor(Math.random()*tipoDado)+1);const somaRolagens=rolagens.reduce((a,b)=>a+b,0),resultadoFinal=somaRolagens+modificador;if(numDados===1){return`${expressao}  >  ${resultadoFinal}`}else{return`${expressao} > [${rolagens.join(", ")}] = ${resultadoFinal}`}}
    function adicionarAoHistorico(texto){const novaRolagem=document.createElement("div");novaRolagem.className="entrada-historico";novaRolagem.innerText=texto;historicoRolagens.prepend(novaRolagem)}
    function executarRolagem(expressao){if(!expressao||btnRolar.disabled)return;historicoRolagens.classList.add("hidden");diceAnimation.classList.remove("hidden");btnRolar.disabled=true;document.querySelectorAll(".btn-dado").forEach(btn=>btn.disabled=true);setTimeout(()=>{const resultado=rolarDados(expressao);adicionarAoHistorico(resultado);entradaDados.value="";historicoRolagens.classList.remove("hidden");diceAnimation.classList.add("hidden");btnRolar.disabled=false;document.querySelectorAll(".btn-dado").forEach(btn=>btn.disabled=false)},1800)}
    
    function renderizarHabilidades() {
        listaHabilidadesContainer.innerHTML = '';
        habilidades.forEach((habilidade, index) => {
            const card = document.createElement('div');
            card.className = 'habilidade-card';
            if (habilidade.turnosAtuais > 0) {
                card.classList.add('em-cooldown');
            }
            // Adiciona o data-index ao card principal para o evento de clique
            card.dataset.index = index;

            card.innerHTML = `
                <div class="cooldown-overlay">
                    <div class="cooldown-numero">${habilidade.turnosAtuais}</div>
                    <div class="cooldown-texto">Turnos</div>
                </div>
                <div class="habilidade-header">
                    <h4>${habilidade.titulo}</h4>
                    <span class="custo">${habilidade.custo || 'Sem custo'} (CD: ${habilidade.turnosMax})</span>
                </div>
                <p class="descricao">${habilidade.descricao.replace(/\n/g, '<br>')}</p>
                <div class="habilidade-botoes">
                    <button class="btn btn-editar"><img src="icons/edit.png" class="icon">Editar</button>
                    <button class="btn btn-excluir"><img src="icons/trash.png" class="icon">Excluir</button>
                </div>
            `;
            listaHabilidadesContainer.appendChild(card);
        });
    }

    function renderizarInventario(){listaInventarioContainer.innerHTML="";inventario.forEach((item,index)=>{const card=document.createElement("div");card.className="habilidade-card";card.innerHTML=`<h4>${item.nome} (x${item.qtd})</h4><div class="habilidade-botoes"><button class="btn btn-excluir" data-index="${index}" data-tipo="item"><img src="icons/trash.png" class="icon">Excluir</button></div>`;listaInventarioContainer.appendChild(card)})}
    
    function abrirModalHabilidade(habilidade = null, index = null) {
        editIndex = index;
        if (habilidade) {
            modalHabilidadeTitulo.innerText = "Editar Habilidade";
            habilidadeTituloInput.value = habilidade.titulo;
            habilidadeCustoInput.value = habilidade.custo;
            habilidadeTurnosInput.value = habilidade.turnosMax;
            habilidadeDescricaoInput.value = habilidade.descricao;
        } else {
            modalHabilidadeTitulo.innerText = "Nova Habilidade";
            habilidadeTituloInput.value = "";
            habilidadeCustoInput.value = "";
            habilidadeTurnosInput.value = 0;
            habilidadeDescricaoInput.value = "";
        }
        modalHabilidadeOverlay.classList.remove('hidden');
    }

    function fecharModalHabilidade(){modalHabilidadeOverlay.classList.add("hidden")}
    function abrirModalConfirmacao(index,tipo){itemParaExcluir={index,tipo};let nome=tipo==="habilidade"?habilidades[index].titulo:inventario[index].nome;confirmModalTexto.innerText=`Tem certeza que deseja excluir "${nome}"?`;modalConfirmOverlay.classList.remove("hidden")}
    function fecharModalConfirmacao(){modalConfirmOverlay.classList.add("hidden");itemParaExcluir=null}
    function exibirImagem(caminho){imagemPlaceholder.innerHTML="";imagemPlaceholder.style.border="none";const imgElement=document.createElement("img");imgElement.src=`file://${caminho}`;imagemPlaceholder.appendChild(imgElement)}
    function parseRecursos(textoInput){const padrao=/([+-])?\s*(\d+)\s*([a-zA-Z]+)/g;let operacoes=[];let match;while((match=padrao.exec(textoInput.toLowerCase()))!==null){const[_,sinal,valorStr,recursoRaw]=match;const recursoOficial=RECURSO_MAP[recursoRaw];if(recursoOficial){operacoes.push({op:sinal||"-",val:parseInt(valorStr,10),res:recursoOficial})}}return operacoes}
    function renderizarDebuffsAtivos(){debuffsAtivosContainer.innerHTML="";if(debuffsAtivos.length===0){debuffsAtivosContainer.innerHTML=`<p style="text-align:center; color: #888;">Nenhum debuff ativo.</p>`;return}debuffsAtivos.forEach((debuff,index)=>{const card=document.createElement("div");card.className="debuff-card";card.innerHTML=`
                <span class="debuff-card-nome">${debuff.nome}</span>
                <div class="debuff-card-controles">
                    <button class="btn-turno" data-index="${index}" data-action="decrease">-</button>
                    <span class="debuff-turnos-display">${debuff.turnos}</span>
                    <button class="btn-turno" data-index="${index}" data-action="increase">+</button>
                    <button class="btn-remover-debuff" data-index="${index}" data-action="remove">&times;</button>
                </div>
            `;debuffsAtivosContainer.appendChild(card)})}
    
    // --- EVENT LISTENERS ---
    setupTabs();
    btnRolar.addEventListener("click",()=>{if(entradaDados.value){executarRolagem(entradaDados.value)}});gridRolagensRapidas.addEventListener("click",e=>{if(e.target.classList.contains("btn-dado")){executarRolagem(`1${e.target.textContent}`)}});btnAddHabilidade.addEventListener("click",()=>abrirModalHabilidade());btnCancelarHabilidade.addEventListener("click",fecharModalHabilidade);modalHabilidadeOverlay.addEventListener("click",e=>{if(e.target===modalHabilidadeOverlay)fecharModalHabilidade()});
    
    btnSalvarHabilidade.addEventListener('click', () => {
        const novaHabilidade = {
            titulo: habilidadeTituloInput.value,
            custo: habilidadeCustoInput.value,
            turnosMax: parseInt(habilidadeTurnosInput.value, 10) || 0,
            turnosAtuais: 0,
            descricao: habilidadeDescricaoInput.value
        };
        if (!novaHabilidade.titulo) {
            alert("O título da habilidade é obrigatório!");
            return;
        }
        if (editIndex !== null) {
            novaHabilidade.turnosAtuais = habilidades[editIndex].turnosAtuais;
            habilidades[editIndex] = novaHabilidade;
        } else {
            habilidades.push(novaHabilidade);
        }
        renderizarHabilidades();
        fecharModalHabilidade();
    });

    btnAddItem.addEventListener("click",()=>{const nomeItem=itemNomeInput.value;const qtdItem=parseInt(itemQtdInput.value,10);if(!nomeItem){alert("O nome do item é obrigatório!");return}if(isNaN(qtdItem)||qtdItem<1){alert("A quantidade deve ser um número válido!");return}const itemExistente=inventario.find(item=>item.nome.toLowerCase()===nomeItem.toLowerCase());if(itemExistente){itemExistente.qtd+=qtdItem}else{inventario.push({nome:nomeItem,qtd:qtdItem})}renderizarInventario();itemNomeInput.value="";itemQtdInput.value=1;itemNomeInput.focus()});
    
    listaHabilidadesContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.habilidade-card');
        if (!card) return;
        const index = parseInt(card.dataset.index, 10);
        const habilidade = habilidades[index];

        // Se o clique foi no botão de editar
        if (e.target.closest('.btn-editar')) {
            abrirModalHabilidade(habilidade, index);
            return;
        }
        // Se o clique foi no botão de excluir
        if (e.target.closest('.btn-excluir')) {
            abrirModalConfirmacao(index, 'habilidade');
            return;
        }
        
        // Se a habilidade tem um cooldown máximo
        if (habilidade.turnosMax > 0) {
            if (habilidade.turnosAtuais > 0) {
                // Se está em cooldown, reduz um turno
                habilidade.turnosAtuais--;
            } else {
                // Se não está em cooldown, ativa
                habilidade.turnosAtuais = habilidade.turnosMax;
            }
            renderizarHabilidades();
        }
    });

    btnConfirmNao.addEventListener("click",fecharModalConfirmacao);modalConfirmOverlay.addEventListener("click",e=>{if(e.target===modalConfirmOverlay)fecharModalConfirmacao()});btnConfirmSim.addEventListener("click",()=>{if(itemParaExcluir){const{index,tipo}=itemParaExcluir;if(tipo==="habilidade"){habilidades.splice(index,1);renderizarHabilidades()}else if(tipo==="item"){inventario.splice(index,1);renderizarInventario()}fecharModalConfirmacao()}});btnCarregarImagem.addEventListener("click",async()=>{const resultado=await window.electronAPI.carregarImagem();if(resultado.success){caminhoImagemAtual=resultado.filePath;exibirImagem(caminhoImagemAtual)}});
    btnSalvar.addEventListener("click",async()=>{const dadosFicha={};const inputs=document.querySelectorAll("#ficha-principal input");inputs.forEach(input=>{if(input.id){if(input.type==="checkbox"){dadosFicha[input.id]=input.checked}else{dadosFicha[input.id]=input.value}}});dadosFicha["anotacoes"]=textoAnotacoes.value;dadosFicha["habilidades"]=habilidades;dadosFicha["inventario"]=inventario;dadosFicha["debuffsAtivos"]=debuffsAtivos;dadosFicha["caminhoImagem"]=caminhoImagemAtual;const resultado=await window.electronAPI.salvarFicha(dadosFicha);if(resultado.success){alert(`Ficha salva com sucesso em: ${resultado.path}`)}else{if(resultado.error)alert(`Erro ao salvar: ${resultado.error}`)}});
    btnCarregar.addEventListener("click",async()=>{const resultado=await window.electronAPI.carregarFicha();if(resultado.success){const dadosFicha=resultado.data;for(const id in dadosFicha){const campo=document.getElementById(id);if(campo){if(campo.type==="checkbox"){campo.checked=dadosFicha[id]}else{campo.value=dadosFicha[id]}}}textoAnotacoes.value=dadosFicha["anotacoes"]||"";habilidades=dadosFicha["habilidades"]||[];renderizarHabilidades();inventario=dadosFicha["inventario"]||[];renderizarInventario();debuffsAtivos=dadosFicha["debuffsAtivos"]||[];renderizarDebuffsAtivos();if(dadosFicha.caminhoImagem){caminhoImagemAtual=dadosFicha.caminhoImagem;exibirImagem(caminhoImagemAtual)}alert("Ficha carregada com sucesso!")}else{if(resultado.error)alert(`Erro ao carregar: ${resultado.error}`)}});
    btnCalcular.addEventListener("click",()=>{novosValores={};const operacoes=parseRecursos(entradaRecursos.value);if(operacoes.length===0){labelPreview.innerText="Formato inválido.";btnConfirmar.disabled=true;return}let previewText="";let podeConfirmar=true;operacoes.forEach(item=>{const campo=document.getElementById(item.res);if(!campo){previewText+=`${item.res}: Campo não encontrado!\n`;podeConfirmar=false;return}try{const valorAtual=parseInt(campo.value||"0",10);const novoValor=item.op==="+"?valorAtual+item.val:valorAtual-item.val;novosValores[item.res]=novoValor;previewText+=`${item.res} (${item.op}): ${valorAtual} -> ${novoValor}`;if(item.op==="-"&&novoValor<0){previewText+=" (INSUFICIENTE!)\n";podeConfirmar=false}else{previewText+="\n"}}catch{previewText+=`${item.res}: Valor inválido na ficha!\n`;podeConfirmar=false}});labelPreview.innerText=previewText.trim();btnConfirmar.disabled=!podeConfirmar});btnConfirmar.addEventListener("click",()=>{for(const recurso in novosValores){const campo=document.getElementById(recurso);if(campo){campo.value=novosValores[recurso]}}entradaRecursos.value="";labelPreview.innerText="---";btnConfirmar.disabled=true});
    btnAddDebuff.addEventListener('click',()=>{const nome=debuffNomeInput.value;const turnos=parseInt(debuffTurnosInput.value,10);if(!nome){alert("O nome do debuff é obrigatório.");return}if(isNaN(turnos)||turnos<1){alert("A quantidade de turnos deve ser um número maior que zero.");return}debuffsAtivos.push({nome,turnos});renderizarDebuffsAtivos();debuffNomeInput.value="";debuffTurnosInput.value=1;debuffNomeInput.focus()});
    debuffsAtivosContainer.addEventListener('click',(e)=>{const target=e.target.closest('button');if(!target)return;const index=parseInt(target.dataset.index,10);const action=target.dataset.action;if(action==='increase'){debuffsAtivos[index].turnos++}if(action==='decrease'){debuffsAtivos[index].turnos--;if(debuffsAtivos[index].turnos<0)debuffsAtivos[index].turnos=0}if(action==='remove'){debuffsAtivos.splice(index,1)}renderizarDebuffsAtivos()});
    
    renderizarDebuffsAtivos();
});