export function initReports(container, state, helpers = {}) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <h3 style="margin:0">Informes</h3>
        <div class="small">Generación y vista previa de informes basados en los datos recolectados.</div>
      </div>
      <div class="tag">Borrador</div>
    </div>

    <div style="height:12px"></div>

    <div class="card" style="flex-direction:column;align-items:flex-start">
      <div style="width:100%;display:flex;justify-content:space-between;gap:12px">
        <div>
          <div style="font-weight:600">${escape(state.company.name||'Sin nombre')}</div>
          <div class="meta">${escape(state.company.sector||'Sin sector')} • ${escape(state.company.location||'')}</div>
        </div>
        <div style="text-align:right">
          <div class="small">Registros</div>
          <div style="font-weight:700;font-size:18px">${(state.collection.problems||[]).length}</div>
        </div>
      </div>

      <div style="height:12px"></div>

      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button id="reportSummary" class="button">Resumen ejecutivo (JSON)</button>
        <button id="reportList" class="button ghost">Lista de elementos</button>
      </div>
    </div>

    <div id="reportsOutput" style="margin-top:12px"></div>
  `;
  container.appendChild(el);

  const out = el.querySelector('#reportsOutput');
  const btnSummary = el.querySelector('#reportSummary');
  const btnList = el.querySelector('#reportList');

  btnSummary.addEventListener('click', () => {
    const summary = {
      company: state.company || {},
      counts: {
        problemas: (state.collection.problems||[]).filter(p=>p.type==='problema').length,
        causas: (state.collection.problems||[]).filter(p=>p.type==='causa').length,
        efectos: (state.collection.problems||[]).filter(p=>p.type==='efecto').length,
        total: (state.collection.problems||[]).length
      },
      generatedAt: new Date().toISOString()
    };
    const pre = document.createElement('pre');
    pre.style.maxHeight='320px'; pre.style.overflow='auto'; pre.style.padding='8px'; pre.style.background='#fbfbfb';
    pre.textContent = JSON.stringify(summary, null, 2);
    out.innerHTML = '';
    out.appendChild(pre);
  });

  btnList.addEventListener('click', () => {
    const items = state.collection.problems || [];
    if(items.length === 0){ out.innerHTML = `<div class="small">No hay elementos registrados.</div>`; return; }
    const list = document.createElement('div'); list.style.display='flex'; list.style.flexDirection='column'; list.style.gap='8px';
    items.forEach(it=>{
      const c = document.createElement('div'); c.className='card'; c.style.flexDirection='column';
      c.innerHTML = `<div style="font-weight:600">${escape(it.title)}</div><div class="small">${escape(it.type)} • id:${escape(it.id)}</div>`;
      list.appendChild(c);
    });
    out.innerHTML = '';
    out.appendChild(list);
  });
}

function escape(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }