import { nanoid } from 'nanoid/';

export function initCollection(container, collection = { problems: [] }, onChange = () => {}) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
      <div>
        <h3 style="margin:0">Recolección de datos - Árbol de Problemas</h3>
        <div class="small">Registre problemas, causas y efectos. Pueden agregarse niveles y relaciones simples.</div>
      </div>
      <div class="tag">Local</div>
    </div>

    <div style="height:12px"></div>

    <div id="inputArea" style="display:flex;gap:8px">
      <input id="p_title" type="text" placeholder="Título del problema principal" style="flex:1" />
      <select id="p_type" style="width:120px">
        <option value="problema">Problema</option>
        <option value="causa">Causa</option>
        <option value="efecto">Efecto</option>
      </select>
      <button id="addBtn" class="button">Agregar</button>
    </div>

    <div style="height:12px"></div>

    <div id="problemsList" class="list"></div>

    <div style="height:8px"></div>

    <div class="actions">
      <button id="exportPNG" class="button secondary">Exportar árbol (JSON)</button>
      <button id="clearAll" class="button ghost">Limpiar</button>
    </div>
  `;

  container.appendChild(el);

  const inputTitle = el.querySelector('#p_title');
  const inputType = el.querySelector('#p_type');
  const addBtn = el.querySelector('#addBtn');
  const list = el.querySelector('#problemsList');
  const exportBtn = el.querySelector('#exportPNG');
  const clearAll = el.querySelector('#clearAll');

  // initialize local state
  const state = { problems: Array.isArray(collection.problems) ? collection.problems.slice() : [] };

  function renderList(){
    list.innerHTML = '';
    if(state.problems.length === 0){
      const msg = document.createElement('div');
      msg.className = 'small';
      msg.textContent = 'No hay elementos. Agregue problemas, causas y efectos.';
      list.appendChild(msg);
      return;
    }
    state.problems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div>
          <div style="font-weight:600">${escape(item.title)}</div>
          <div class="meta">${item.type} • id: ${item.id}</div>
        </div>
        <div class="controls">
          <button class="icon-btn edit">✏️</button>
          <button class="icon-btn link">🔗</button>
          <button class="icon-btn del">🗑️</button>
        </div>
      `;
      // events
      card.querySelector('.del').addEventListener('click', async () => {
        const ok = await window.showConfirm('Eliminar este elemento?', 'Eliminar');
        if(!ok) return;
        const idx = state.problems.findIndex(p => p.id === item.id);
        if(idx >= 0){ state.problems.splice(idx,1); commit(); }
      });
      card.querySelector('.edit').addEventListener('click', async () => {
        const newTitle = await window.showPrompt('Editar título', item.title, 'Editar');
        if(newTitle==null) return;
        item.title = newTitle.trim();
        commit();
      });
      card.querySelector('.link').addEventListener('click', () => {
        showLinkEditor(item);
      });

      list.appendChild(card);
    });
  }

  function showLinkEditor(item){
    const targets = state.problems.filter(p => p.id !== item.id);
    const sel = document.createElement('select');
    sel.style.minWidth = '160px';
    const optNone = document.createElement('option'); optNone.value=''; optNone.textContent='-- seleccionar --';
    sel.appendChild(optNone);
    targets.forEach(t => {
      const o = document.createElement('option'); o.value = t.id; o.textContent = `${t.title} (${t.type})`; sel.appendChild(o);
    });

    const containerPopup = document.createElement('div');
    containerPopup.className = 'panel';
    containerPopup.style.position = 'absolute';
    containerPopup.style.zIndex = 60;
    containerPopup.style.left = '50%';
    containerPopup.style.top = '50%';
    containerPopup.style.transform = 'translate(-50%,-50%)';
    containerPopup.style.width = '90%';
    containerPopup.style.maxWidth = '420px';
    containerPopup.innerHTML = `
      <h4 style="margin:0 0 8px 0">Vincular: ${escape(item.title)}</h4>
      <div style="margin-bottom:8px">Seleccionar elemento al que se conecta (relación simple)</div>
    `;
    containerPopup.appendChild(sel);
    const actions = document.createElement('div'); actions.className='actions';
    const btnOk = document.createElement('button'); btnOk.className='button'; btnOk.textContent='Guardar';
    const btnCancel = document.createElement('button'); btnCancel.className='button ghost'; btnCancel.textContent='Cancelar';
    actions.appendChild(btnOk); actions.appendChild(btnCancel);
    containerPopup.appendChild(actions);
    document.body.appendChild(containerPopup);

    btnOk.addEventListener('click', async () => {
      const targetId = sel.value;
      if(!targetId){ await window.showMessage('Seleccione un elemento válido.','Validación'); return; }
      // keep simple relation: store outgoing links
      item.links = item.links || [];
      if(!item.links.includes(targetId)) item.links.push(targetId);
      commit();
      document.body.removeChild(containerPopup);
    });
    btnCancel.addEventListener('click', () => document.body.removeChild(containerPopup));
  }

  function commit(){
    onChange({ problems: state.problems });
    renderList();
  }

  addBtn.addEventListener('click', async () => {
    const title = inputTitle.value.trim();
    const type = inputType.value;
    if(!title){ await window.showMessage('Ingrese un título.','Validación'); return; }
    const node = { id: nanoid(7), title, type, createdAt: new Date().toISOString(), links: [] };
    state.problems.push(node);
    inputTitle.value = '';
    commit();
  });

  exportBtn.addEventListener('click', () => {
    const data = { problems: state.problems.slice(), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `lf-problems-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  clearAll.addEventListener('click', async () => {
    const ok = await window.showConfirm('Eliminar todos los elementos?','Limpiar');
    if(!ok) return;
    state.problems = [];
    commit();
  });

  // initial rendering from provided collection
  if(state.problems.length === 0 && Array.isArray(collection.problems) && collection.problems.length>0){
    state.problems = collection.problems.slice();
  }
  renderList();
}
function escape(str){ return String(str||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }