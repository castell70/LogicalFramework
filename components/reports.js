export function initReports(container, state, helpers = {}) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <h3 style="margin:0">Informes</h3>
        <div class="small">Selecciona un tipo de informe para ver la vista previa y exportarlo.</div>
      </div>
      <div class="tag">Borrador</div>
    </div>

    <div style="height:12px"></div>

    <div style="display:flex;gap:12px;flex-wrap:wrap">
      <div class="card" style="flex-direction:column;min-width:220px;max-width:320px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700">Resumen ejecutivo</div>
            <div class="small">Síntesis estructurada con métricas clave y hallazgos principales.</div>
          </div>
          <div class="small" style="text-align:right">Ideal para: Alta dirección</div>
        </div>
        <div style="height:8px"></div>
        <div style="display:flex;gap:8px">
          <button id="reportSummary" class="button" style="flex:1">Vista previa</button>
          <button id="exportSummary" class="button ghost" style="flex:1">Exportar</button>
        </div>
      </div>

      <div class="card" style="flex-direction:column;min-width:220px;max-width:320px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700">Lista detallada</div>
            <div class="small">Listado completo de problemas, causas y efectos con IDs y fechas.</div>
          </div>
          <div class="small" style="text-align:right">Ideal para: Operaciones</div>
        </div>
        <div style="height:8px"></div>
        <div style="display:flex;gap:8px">
          <button id="reportList" class="button" style="flex:1">Vista previa</button>
          <button id="exportList" class="button ghost" style="flex:1">Exportar</button>
        </div>
      </div>

      <div class="card" style="flex-direction:column;min-width:220px;max-width:320px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700">Árbol simplificado</div>
            <div class="small">Representación jerárquica textual de vinculaciones entre elementos.</div>
          </div>
          <div class="small" style="text-align:right">Ideal para: Análisis</div>
        </div>
        <div style="height:8px"></div>
        <div style="display:flex;gap:8px">
          <button id="reportTree" class="button" style="flex:1">Vista previa</button>
          <button id="exportTree" class="button ghost" style="flex:1">Exportar</button>
        </div>
      </div>
    </div>

    <div id="reportsOutput" style="margin-top:12px"></div>
  `;
  container.appendChild(el);

  const out = el.querySelector('#reportsOutput');
  const btnSummary = el.querySelector('#reportSummary');
  const btnList = el.querySelector('#reportList');
  const btnTree = el.querySelector('#reportTree');
  const expSummary = el.querySelector('#exportSummary');
  const expList = el.querySelector('#exportList');
  const expTree = el.querySelector('#exportTree');

  btnSummary.addEventListener('click', () => {
    const summary = buildExecutiveSummary(state);
    out.innerHTML = renderExecutiveSummary(summary);
  });

  expSummary.addEventListener('click', () => {
    const summary = buildExecutiveSummary(state);
    downloadJSON(summary, `lf-summary-${Date.now()}.json`);
  });

  btnList.addEventListener('click', () => {
    const items = (state.collection.problems||[]);
    out.innerHTML = renderDetailedList(items, state);
  });

  expList.addEventListener('click', () => {
    const items = (state.collection.problems||[]);
    downloadJSON({ items, exportedAt: new Date().toISOString() }, `lf-list-${Date.now()}.json`);
  });

  btnTree.addEventListener('click', () => {
    out.innerHTML = renderTreeView(state.collection);
  });

  expTree.addEventListener('click', () => {
    const tree = state.collection || { problems: [] };
    downloadJSON({ tree, exportedAt: new Date().toISOString() }, `lf-tree-${Date.now()}.json`);
  });
}

/* Helpers for report generation and rendering */

function buildExecutiveSummary(state){
  const company = state.company || {};
  const items = state.collection.problems || [];
  const counts = {
    problemas: items.filter(p => p.type==='problema').length,
    causas: items.filter(p => p.type==='causa').length,
    efectos: items.filter(p => p.type==='efecto').length,
    total: items.length
  };
  // pick top problem (first problema) for highlight
  const main = items.find(p => p.type==='problema') || items[0] || null;
  const highlights = [];
  if(main) highlights.push({ title: main.title, note: 'Problema principal identificado' });
  // collect most common causes (simple heuristic: first 3 causas)
  const causes = items.filter(p => p.type==='causa').slice(0,3).map(c => c.title);
  return { generatedAt: new Date().toISOString(), company, counts, highlights, topCauses: causes };
}

function renderExecutiveSummary(summary){
  return `
    <div class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:700">${escape(summary.company.name||'Proyecto sin título')}</div>
          <div class="small">${escape(summary.company.sector||'')}</div>
        </div>
        <div style="text-align:right">
          <div class="small">Generado</div>
          <div style="font-weight:700">${escape(new Date(summary.generatedAt).toLocaleString())}</div>
        </div>
      </div>

      <div style="height:10px"></div>

      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div class="card" style="min-width:160px">
          <div class="small">Problemas</div>
          <div style="font-weight:700;font-size:18px">${summary.counts.problemas}</div>
        </div>
        <div class="card" style="min-width:160px">
          <div class="small">Causas</div>
          <div style="font-weight:700;font-size:18px">${summary.counts.causas}</div>
        </div>
        <div class="card" style="min-width:160px">
          <div class="small">Efectos</div>
          <div style="font-weight:700;font-size:18px">${summary.counts.efectos}</div>
        </div>
      </div>

      <div style="height:10px"></div>

      <div>
        <div class="small">Destacados</div>
        <ul>
          ${summary.highlights.map(h => `<li><strong>${escape(h.title)}</strong> — ${escape(h.note)}</li>`).join('')}
        </ul>
      </div>

      <div style="height:8px"></div>

      <div>
        <div class="small">Principales causas (ejemplo)</div>
        <ul>${summary.topCauses.map(c => `<li>${escape(c)}</li>`).join('')}</ul>
      </div>
    </div>
  `;
}

function renderDetailedList(items, state){
  if(!items || items.length===0) return `<div class="small">No hay elementos registrados.</div>`;

  // build map to resolve link ids or codes to full items
  const all = state.collection?.problems || [];
  const lookup = new Map(all.map(i => [i.id, i]));
  function resolveRefLocal(ref){
    if(!ref) return null;
    const byId = lookup.get(ref);
    if(byId) return byId;
    for(const v of all){
      if(v.code && String(v.code) === String(ref)) return v;
    }
    return null;
  }

  // Get all problems (roots) to group by; if none, fall back to listing non-problem items
  const problems = all.filter(i => i.type === 'problema');
  const otherItems = all.filter(i => i.type !== 'problema');

  // If there are no explicit problems, show grouped by available items by type
  if(problems.length === 0){
    const groups = {
      causas: otherItems.filter(i => i.type === 'causa'),
      efectos: otherItems.filter(i => i.type === 'efecto')
    };
    return `
      <div style="display:flex;flex-direction:column;gap:8px">
        <div class="small" style="font-weight:700">Causas</div>
        ${groups.causas.map(it => renderItemCard(it, lookup)).join('')}
        <div style="height:8px"></div>
        <div class="small" style="font-weight:700">Efectos</div>
        ${groups.efectos.map(it => renderItemCard(it, lookup)).join('')}
      </div>
    `;
  }

  // For each problem, collect linked causes and effects (by ids in problem.links)
  const sections = problems.map(p => {
    const linkedIds = new Set(p.links || []);
    // resolve linked items preserving original type categorization
    const linked = Array.from(linkedIds).map(id => lookup.get(id)).filter(Boolean);
    const causas = linked.filter(l => l.type === 'causa');
    const efectos = linked.filter(l => l.type === 'efecto');

    // Additionally, include any causes/effects that explicitly reference this problem (reverse links)
    const reverseLinked = all.filter(it => (it.links||[]).includes(p.id));
    reverseLinked.forEach(r => {
      if(r.type === 'causa' && !causas.find(x=>x.id===r.id)) causas.push(r);
      if(r.type === 'efecto' && !efectos.find(x=>x.id===r.id)) efectos.push(r);
    });

    // Build HTML for this problem block with separators
    return `
      <div class="card" style="flex-direction:column;align-items:flex-start">
        <div style="display:flex;justify-content:space-between;width:100%;gap:12px">
          <div>
            <div style="font-weight:700">${escape(p.title)}</div>
            <div class="small">Problema • id: ${escape(p.id)} ${p.code ? '• ' + escape(p.code) : ''}</div>
          </div>
          <div style="min-width:120px;text-align:right" class="small">${escape(new Date(p.createdAt||'').toLocaleString()||'')}</div>
        </div>

        <div style="height:10px"></div>

        <div style="width:100%;display:flex;gap:10px;flex-wrap:wrap">
          <div style="flex:1;min-width:220px">
            <div class="small" style="font-weight:700">Causas (vinculadas)</div>
            ${causas.length ? causas.map(c => renderCompactListItem(c)).join('') : `<div class="small">— Ninguna —</div>`}
          </div>

          <div style="flex:1;min-width:220px">
            <div class="small" style="font-weight:700">Efectos (vinculados)</div>
            ${efectos.length ? efectos.map(e => renderCompactListItem(e)).join('') : `<div class="small">— Ninguno —</div>`}
          </div>
        </div>
      </div>
    `;
  }).join('<div style="height:8px"></div>');

  return `<div style="display:flex;flex-direction:column;gap:8px">${sections}</div>`;

  // helper to render a full item card (used in fallback)
  function renderItemCard(it, lookupMap){
    const linksResolved = (it.links||[]).map(id => {
      const target = lookupMap.get(id);
      return target ? `${escape(target.code || target.id)}${target.title ? ' — ' + escape(target.title) : ''}` : escape(id);
    }).join(', ');
    return `
      <div class="card" style="flex-direction:column;align-items:flex-start">
        <div style="display:flex;justify-content:space-between;width:100%;gap:12px">
          <div>
            <div style="font-weight:600">${escape(it.title)}</div>
            <div class="small">${escape(it.type)} • id: ${escape(it.id)}</div>
          </div>
          <div style="min-width:120px;text-align:right" class="small">${escape(new Date(it.createdAt||'').toLocaleString()||'')}</div>
        </div>
        <div style="height:8px"></div>
        <div class="small">Conexiones: ${linksResolved || '—'}</div>
      </div>
    `;
  }

  // compact list item for causes/effects inside a problem block
  function renderCompactListItem(it){
    return `
      <div style="padding:8px;border-radius:8px;border:1px solid #eef0f2;background:#fff;margin-top:8px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:600">${escape(it.title)}</div>
          <div class="small" style="text-align:right">${escape(it.code || it.id)}</div>
        </div>
        <div class="small" style="margin-top:6px;opacity:0.9">${escape(it.type)} • ${escape(new Date(it.createdAt||'').toLocaleDateString()||'')}</div>
      </div>
    `;
  }
}

function renderTreeView(collection){
  const items = collection.problems || [];
  if(!items || items.length===0) return `<div class="small">No hay datos para mostrar.</div>`;

  // map for id -> item lookup
  const map = new Map(items.map(i => [i.id, i]));
  function resolveRefMap(ref){
    if(!ref) return null;
    const byId = map.get(ref);
    if(byId) return byId;
    for(const v of items){
      if(v.code && String(v.code) === String(ref)) return v;
    }
    return null;
  }

  // group by type with desired ordering: efectos (top), problemas (middle), causas (bottom/raíces)
  const efectos = items.filter(i => i.type === 'efecto');
  const problemas = items.filter(i => i.type === 'problema');
  const causas = items.filter(i => i.type === 'causa');

  // helper to render a single card with connections resolved to titles
  function renderCard(it){
    const links = (it.links || []).map(id => {
      const target = map.get(id);
      return target ? `${escape(target.code || target.id)}${target.title ? ' — ' + escape(target.title) : ''}` : escape(id);
    }).join(' ↦ ');
    return `
      <div class="card" style="flex-direction:column;align-items:flex-start">
        <div style="font-weight:600">${escape(it.title)} <span class="small">(${escape(it.type)})</span></div>
        <div class="small" style="margin-top:6px">Conexiones: ${links || '—'}</div>
      </div>`;
  }

  function renderRow(title, arr){
    if(!arr || arr.length === 0) return `<div style="width:100%"><div class="small">${title}</div><div class="small">— Ninguno —</div></div>`;
    const cards = arr.map(renderCard).join('');
    return `
      <div style="width:100%;display:flex;flex-direction:column;gap:6px;align-items:center">
        <div class="small" style="font-weight:700">${title}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;width:100%">${cards}</div>
      </div>`;
  }

  // Compose ordered layout: efectos (arriba - ramas), problemas (centro - tronco), causas (abajo - raíces)
  const html = `
    <div style="display:flex;flex-direction:column;gap:12px;align-items:stretch">
      ${renderRow('Efectos (ramas - arriba)', efectos)}
      ${renderRow('Problemas (tronco - centro)', problemas)}
      ${renderRow('Causas (raíces - abajo)', causas)}
    </div>
  `;
  return html;
}

function downloadJSON(obj, filename){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function escape(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }