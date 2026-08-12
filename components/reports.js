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
      <div class="card" style="flex-direction:column;min-width:220px;max-width:320px;border:1px solid rgba(11,93,63,0.18);background:#fbfdfc">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:700">Marco Lógico</div>
            <div class="small">Informe en formato de plantilla: Jerarquía de objetivos / Indicador / Medios de verificación / Supuesto.</div>
          </div>
          <div class="tag" style="background:#e3eef9;color:#0b3f5d">Excel</div>
        </div>
        <div style="height:8px"></div>
        <div class="small">Requiere objetivo general, objetivos, resultados y actividades con sus indicadores, medios de verificación y supuestos.</div>
        <div style="height:8px"></div>
        <div style="display:flex;gap:8px">
          <button id="reportMarco" class="button" style="flex:1">Vista previa</button>
          <button id="exportMarco" class="button ghost" style="flex:1">Exportar</button>
        </div>
        <div style="height:8px"></div>
        <button id="suggestMarco" class="button secondary" style="width:100%">Analizar & proponer indicadores</button>
      </div>

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
  const btnMarco = el.querySelector('#reportMarco');
  const expMarco = el.querySelector('#exportMarco');
  const suggestMarco = el.querySelector('#suggestMarco');
  const btnSummary = el.querySelector('#reportSummary');
  const btnList = el.querySelector('#reportList');
  const btnTree = el.querySelector('#reportTree');
  const expSummary = el.querySelector('#exportSummary');
  const expList = el.querySelector('#exportList');
  const expTree = el.querySelector('#exportTree');

  btnMarco.addEventListener('click', () => {
    const report = buildMarcoReport(state.marco, state.company);
    out.innerHTML = report.html;
  });

  expMarco.addEventListener('click', () => {
    const report = buildMarcoReport(state.marco, state.company);
    if(report.ok){
      downloadJSON(report.export, `lf-marco-${Date.now()}.json`);
    } else {
      out.innerHTML = report.html;
    }
  });

  suggestMarco.addEventListener('click', () => {
    const analysis = analyzeMarco(state.marco);
    out.innerHTML = renderSuggestions(analysis);
  });

  // Delegated events for the suggestion panel buttons
  out.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-act]');
    if(!btn) return;
    const idx = Number(btn.dataset.idx);
    if(btn.dataset.act === 'suggest-apply' && !Number.isNaN(idx)){
      state.marco = applySuggestion(state.marco, idx);
      if(helpers.saveMarco) helpers.saveMarco(state.marco);
      out.innerHTML = renderSuggestions(analyzeMarco(state.marco), `Aplicado al ${btn.dataset.label || ''}.`);
    } else if(btn.dataset.act === 'suggest-apply-all'){
      state.marco = applyAllSuggestions(state.marco);
      if(helpers.saveMarco) helpers.saveMarco(state.marco);
      out.innerHTML = renderSuggestions(analyzeMarco(state.marco), 'Todas las sugerencias fueron aplicadas.');
    }
  });

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

/* Informe Marco Lógico — plantilla de 4 columnas (formato del archivo Excel) */

// Columnas del encabezado de la plantilla
const MARCO_HEADERS = ['Jerarquía de objetivos', 'Indicador', 'Medios de verificación', 'Supuesto'];
// Niveles de la jerarquía de la plantilla, en orden
const MARCO_LEVELS = ['Objetivo general', 'Objetivo', 'Resultado', 'Actividad'];
// Celdas obligatorias por nivel para poder generar el informe
const MARCO_REQUIRED = {
  'Objetivo general': ['text'],
  'Objetivo': ['text', 'indicador', 'medios', 'supuesto'],
  'Resultado': ['text', 'indicador', 'medios', 'supuesto'],
  'Actividad': ['text']
};
const MARCO_FIELD_LABEL = { text: 'enunciado', indicador: 'Indicador', medios: 'medios de verificación', supuesto: 'Supuesto' };

// Etiqueta numerada por fila (Objetivo 1, Resultado 1.1, Actividad 1.1.1, ...)
function marcoLabeledRows(rows){
  let obj = 0, res = 0, act = 0;
  return (rows||[]).map(r => {
    if(!r || !r.jerarquia) return { label: '', row: r||{}, level: '' };
    const level = r.jerarquia;
    let label;
    if(level === 'Objetivo general'){ obj = 0; res = 0; act = 0; label = 'Objetivo general'; }
    else if(level === 'Objetivo'){ obj++; res = 0; act = 0; label = `Objetivo ${obj}`; }
    else if(level === 'Resultado'){ res++; act = 0; label = `Resultado ${obj}.${res}`; }
    else if(level === 'Actividad'){ act++; label = `Actividad ${obj}.${res}.${act}`; }
    else { label = level; }
    return { label, row: r, level };
  });
}

// Valida que toda la información necesaria para la plantilla esté completa.
// Devuelve la lista de elementos faltantes (vacía si está completa).
function validateMarco(marco){
  const missing = [];
  const rows = (marco && Array.isArray(marco.rows)) ? marco.rows : [];
  if(rows.length === 0){
    missing.push('No hay filas registradas en el Marco Lógico. Carga el ejemplo o importa un archivo con la estructura "marco.rows".');
    return missing;
  }

  const present = {};
  rows.forEach(r => { if(r && MARCO_LEVELS.includes(r.jerarquia)) present[r.jerarquia] = true; });

  MARCO_LEVELS.forEach(lv => {
    if(!present[lv]) missing.push(`Falta al menos un "${lv}".`);
  });

  marcoLabeledRows(rows).forEach(({ label, row, level }) => {
    if(!level || !MARCO_REQUIRED[level]) return;
    MARCO_REQUIRED[level].forEach(field => {
      const val = row[field];
      if(val === undefined || val === null || String(val).trim() === ''){
        missing.push(`"${label}": falta el ${MARCO_FIELD_LABEL[field]}.`);
      }
    });
  });

  return missing;
}

// Construye el informe completo. Devuelve { ok, html, export }.
function buildMarcoReport(marco, company){
  const missing = validateMarco(marco);
  if(missing.length > 0){
    return { ok: false, html: renderMarcoMissing(missing), export: null };
  }
  const labeled = marcoLabeledRows(marco.rows).filter(x => x.level);
  const exportData = {
    tipo: 'informe_marco_logico',
    encabezado: MARCO_HEADERS,
    proyecto: company ? (company.name||'') : '',
    sector: company ? (company.sector||'') : '',
    filas: labeled.map(({ label, row }) => ({ jerarquia: label, texto: row.text, indicador: row.indicador||'', medios: row.medios||'', supuesto: row.supuesto||'' })),
    generado: new Date().toISOString()
  };
  return { ok: true, html: renderMarcoTable(labeled, company), export: exportData };
}

function renderMarcoMissing(missing){
  const items = missing.map(m => `<li>${escape(m)}</li>`).join('');
  return `
    <div class="panel" style="border:1px solid var(--danger);border-left:4px solid var(--danger);background:#fdf3f2">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:20px" aria-hidden="true">⚠️</span>
        <div style="font-weight:700;color:var(--danger)">No se puede generar el informe del Marco Lógico</div>
      </div>
      <div class="small" style="margin-top:6px;color:#7a1f1f">
        Faltan los siguientes elementos de la plantilla (Jerarquía de objetivos / Indicador / Medios de verificación / Supuesto):
      </div>
      <ul style="margin:8px 0 0 0;padding-left:20px;color:#5b1414;font-size:13px">${items}</ul>
    </div>
  `;
}

const MARCO_LEVEL_BG = {
  'Objetivo general': '#eef6f3',
  'Objetivo': '#fdfaf1',
  'Resultado': '#f2f8f5',
  'Actividad': '#f7f8fa'
};

function renderMarcoTable(labeled, company){
  const rows = labeled.map(({ label, row, level }) => {
    const bg = MARCO_LEVEL_BG[level] || '#ffffff';
    const bold = level !== 'Actividad';
    return `
      <tr style="background:${bg};border-top:1px solid #eef0f2">
        <td style="padding:9px;vertical-align:top">
          <div style="font-weight:700;color:var(--accent);font-size:11px;text-transform:uppercase;letter-spacing:0.3px;margin-bottom:2px">${escape(label)}</div>
          <div style="font-size:13px;font-weight:${bold?'600':'400'}">${escape(row.text||'')}</div>
        </td>
        <td style="padding:9px;vertical-align:top;font-size:13px">${escape(row.indicador||'')}</td>
        <td style="padding:9px;vertical-align:top;font-size:13px">${escape(row.medios||'')}</td>
        <td style="padding:9px;vertical-align:top;font-size:13px">${escape(row.supuesto||'')}</td>
      </tr>`;
  }).join('');

  return `
    <div class="panel" style="overflow-x:auto">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div>
          <div style="font-weight:700;font-size:15px">Informe — Marco Lógico del Proyecto</div>
          <div class="small">${escape(company && company.name ? company.name : 'Proyecto sin título')}${company && company.sector ? ' • ' + escape(company.sector) : ''}</div>
        </div>
        <div class="small" style="text-align:right">Generado<br/>${escape(new Date().toLocaleString())}</div>
      </div>
      <div style="overflow-x:auto">
        <table style="border-collapse:collapse;width:100%;min-width:760px">
          <thead>
            <tr style="background:linear-gradient(180deg,#237a5a,#0b5d3f);color:#fff;text-align:left">
              ${MARCO_HEADERS.map(h => `<th style="padding:10px;font-size:12px;font-weight:600">${escape(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

/* Algoritmo de análisis y propuesta de Indicador / Medios de verificación / Supuesto.
   Reconoce el tema de cada dato del Marco Lógico (a qué se refiere) mediante coincidencia
   de palabras clave y sugiere los elementos relacionados más adecuados por nivel. */

const SUGGEST_THEMES = [
  {
    id: 'agua',
    label: 'Acceso y uso del agua',
    keywords: [
      { w: 'agua', p: 4 }, { w: 'beber', p: 3 }, { w: 'grifo', p: 3 }, { w: 'hidratacion', p: 3 },
      { w: 'pozo', p: 3 }, { w: 'contenedor', p: 2 }, { w: 'litros', p: 3 }, { w: 'punto de agua', p: 3 },
      { w: 'suministro de agua', p: 3 }, { w: 'potable', p: 3 }
    ],
    indicators: [
      '% de la población con acceso a las redes de agua al final del proyecto.',
      'Número de puntos de agua que cumplen la norma de distancia (menos de 500 m de cualquier hogar) al final del proyecto.',
      'Litros de agua por persona al día disponibles para beber y uso doméstico.'
    ],
    verification: ['Línea de base y línea final, informes técnicos de WASH y encuestas a los hogares.'],
    assumptions: ['La afluencia de población se mantiene estable durante el proyecto.', 'Las fuentes de agua se mantienen dentro de los niveles previstos.']
  },
  {
    id: 'saneamiento',
    label: 'Saneamiento y letrinas',
    keywords: [
      { w: 'letrina', p: 4 }, { w: 'saneamiento', p: 4 }, { w: 'alcantarillado', p: 3 }, { w: 'drenaje', p: 2 },
      { w: 'inodoro', p: 3 }, { w: 'sanitario', p: 2 }, { w: 'bano', p: 2 }, { w: 'residuos', p: 2 },
      { w: 'aguas residuales', p: 3 }
    ],
    indicators: [
      '% de hogares que utilizan letrinas adecuadas y seguras al final del proyecto.',
      'Número de letrinas construidas a menos de 50 metros de los hogares (máx. 20 personas por letrina).',
      '% de letrinas con cerraduras e iluminación adecuadas.'
    ],
    verification: ['Informes técnicos de WASH, observación estandarizada y grupos de discusión con la comunidad.'],
    assumptions: ['Las letrinas se mantienen abastecidas y en buen estado para garantizar su uso continuo.', 'No se produce una afluencia adicional que afecte la proporción letrinas/población.']
  },
  {
    id: 'inclusion',
    label: 'Accesibilidad e inclusión',
    keywords: [
      { w: 'discapacidad', p: 4 }, { w: 'silla de ruedas', p: 4 }, { w: 'accesible', p: 3 }, { w: 'accesibilidad', p: 3 },
      { w: 'rampa', p: 3 }, { w: 'barandilla', p: 3 }, { w: 'inclusion', p: 2 }, { w: 'espacio para sillas', p: 4 }
    ],
    indicators: [
      'Número de instalaciones construidas que cumplen los requisitos de accesibilidad (espacio para sillas de ruedas, rampas y barandillas) al finalizar el proyecto.',
      '% de instalaciones accesibles para personas con discapacidad respecto del total construido.'
    ],
    verification: ['Informes técnicos de WASH y observación estandarizada.'],
    assumptions: ['Las instalaciones accesibles se utilizan prioritariamente por las personas con discapacidad.', 'Todos los componentes de accesibilidad se instalan conforme a las normas (p. ej. SPHERE).']
  },
  {
    id: 'infraestructura',
    label: 'Infraestructura y servicios básicos',
    keywords: [
      { w: 'infraestructura', p: 4 }, { w: 'red', p: 1.5 }, { w: 'reparacion', p: 3 }, { w: 'mantenimiento', p: 3 },
      { w: 'rehabilitacion', p: 3 }, { w: 'construccion', p: 3 }, { w: 'instalacion', p: 2 }, { w: 'servicio basico', p: 2 },
      { w: 'funcionamiento', p: 2 }, { w: 'operacion', p: 1.5 }
    ],
    indicators: [
      '% de necesidades de reparación y mantenimiento que el municipio es capaz de evaluar y abordar al final del proyecto.',
      '% de sistemas e instalaciones que cuentan con un sistema de gestión funcional y responsable.',
      '% de redes que funcionan al 100 % al final del proyecto.'
    ],
    verification: ['Evaluaciones técnicas, expedientes de adquisición e informes de mantenimiento.'],
    assumptions: ['Los procedimientos operativos estándar se aplican conforme a lo establecido.', 'No se producen conflictos que dañen o destruyan las redes.']
  },
  {
    id: 'capacitacion',
    label: 'Capacitación y fortalecimiento de capacidades',
    keywords: [
      { w: 'capacitacion', p: 4 }, { w: 'formacion', p: 3 }, { w: 'entrenamiento', p: 3 }, { w: 'taller', p: 2 },
      { w: 'curso', p: 2 }, { w: 'competencia', p: 2 }, { w: 'destreza', p: 3 }, { w: 'conocimiento', p: 2 },
      { w: 'aprendizaje', p: 2 }, { w: 'formador', p: 3 }, { w: 'personal tecnico', p: 2 }
    ],
    indicators: [
      'Número de participantes que completan la formación asistiendo al menos al 85 % de las sesiones al final de la fase.',
      'Número de personas capacitadas que demuestran conocimientos en la evaluación previa y posterior.',
      '% de mejora en la evaluación de conocimientos al final de la formación.'
    ],
    verification: ['Hojas de asistencia, informes de los formadores, fotografías y evaluaciones previas y posteriores.'],
    assumptions: ['El personal permanece en su puesto y transfiere los conocimientos al nuevo personal.', 'El personal asiste al menos al 85 % de la formación y aplica lo aprendido.']
  },
  {
    id: 'salud',
    label: 'Salud e higiene',
    keywords: [
      { w: 'salud', p: 3 }, { w: 'higiene', p: 3 }, { w: 'enfermedad', p: 3 }, { w: 'prevencion', p: 2 },
      { w: 'bienestar', p: 2 }, { w: 'lavarse', p: 3 }, { w: 'lavado de manos', p: 3 }, { w: 'comunidad', p: 0.5 }
    ],
    indicators: [
      '% de la población que adopta prácticas seguras de higiene al final del proyecto.',
      '% de hogares con acceso a instalaciones adecuadas para el lavado de manos.'
    ],
    verification: ['Encuestas a la comunidad y observación estandarizada.'],
    assumptions: ['La comunidad adopta las buenas prácticas de higiene.', 'Los hábitos de uso se mantienen estables durante el proyecto.']
  },
  {
    id: 'procedimientos',
    label: 'Procedimientos operativos y normativa',
    keywords: [
      { w: 'procedimiento', p: 3 }, { w: 'operativo', p: 1 }, { w: 'estandar', p: 1 }, { w: 'protocolo', p: 2 },
      { w: 'norma', p: 1 }, { w: 'manual', p: 2 }, { w: 'documento', p: 1 }, { w: 'proceso', p: 1 }, { w: 'directriz', p: 2 }
    ],
    indicators: [
      'Número de procedimientos operativos estandarizados completados y finalizados al final del proyecto.',
      '% de procedimientos que se ajustan a las normas nacionales e internacionales.'
    ],
    verification: ['Versiones finalizadas y firmadas de los procedimientos operativos estándar.'],
    assumptions: ['Los procedimientos operativos se ajustan a los temas tratados en la formación.', 'Los nuevos miembros del equipo reciben orientación sobre los procedimientos estándar.']
  },
  {
    id: 'abastecimiento',
    label: 'Adquisición y abastecimiento',
    keywords: [
      { w: 'repuesto', p: 4 }, { w: 'pieza', p: 3 }, { w: 'equipo', p: 2 }, { w: 'adquisicion', p: 3 }, { w: 'suministro', p: 3 },
      { w: 'compra', p: 2 }, { w: 'provision', p: 3 }, { w: 'almacen', p: 2 }, { w: 'almacenamiento', p: 2 }, { w: 'inventario', p: 2 }
    ],
    indicators: [
      'Número y especificación de las piezas de repuesto adquiridas según la evaluación de necesidades previstas.',
      '% de repuestos disponibles al inicio de la campaña de mantenimiento.'
    ],
    verification: ['Expedientes de adquisición, evaluación técnica y registro de inventario.'],
    assumptions: ['Las piezas de repuesto y los equipos se almacenan de forma segura y no se producen robos.', 'Todas las piezas de repuesto están disponibles en el mercado local.']
  },
  {
    id: 'comercial',
    label: 'Comercialización y ventas',
    keywords: [
      { w: 'venta', p: 3 }, { w: 'comercial', p: 2 }, { w: 'mercado', p: 2 }, { w: 'canal', p: 2 }, { w: 'cliente', p: 2 },
      { w: 'marketing', p: 3 }, { w: 'digital', p: 2 }, { w: 'demanda', p: 2 }, { w: 'ingresos', p: 2 }, { w: 'exportacion', p: 2 }
    ],
    indicators: [
      '% de crecimiento de las ventas a través de canales modernos al cierre del proyecto.',
      'Número de canales de venta modernos activos al final del proyecto.',
      '% de clientes o contratos retenidos durante el periodo.'
    ],
    verification: ['Informes de ventas por canal, analítica digital y reportes comerciales.'],
    assumptions: ['Los canales y distribuidores mantienen condiciones de acceso estables.', 'El comportamiento del mercado se mantiene dentro de lo previsto.']
  },
  {
    id: 'personas',
    label: 'Recursos humanos y retención',
    keywords: [
      { w: 'personal', p: 2 }, { w: 'rotacion', p: 3 }, { w: 'compensacion', p: 3 }, { w: 'beneficio', p: 2 },
      { w: 'retencion', p: 2 }, { w: 'talento', p: 2 }, { w: 'salario', p: 2 }, { w: 'empleados', p: 2 },
      { w: 'nomina', p: 2 }, { w: 'clima laboral', p: 3 }
    ],
    indicators: [
      '% de reducción en la tasa de rotación anual de personal clave al final del proyecto.',
      '% de personal cubierto por el nuevo esquema de compensación y beneficios.',
      'Número de puestos clave retenidos durante el periodo.'
    ],
    verification: ['Reportes de recursos humanos, encuestas de clima laboral y nóminas.'],
    assumptions: ['El mercado laboral local no cambia inesperadamente las expectativas salariales.', 'El personal valora y acepta el nuevo esquema de beneficios.']
  },
  {
    id: 'produccion',
    label: 'Producción y productividad',
    keywords: [
      { w: 'produccion', p: 4 }, { w: 'productividad', p: 4 }, { w: 'cosecha', p: 3 }, { w: 'cultivo', p: 3 },
      { w: 'hectarea', p: 3 }, { w: 'rendimiento', p: 3 }, { w: 'kilogramos', p: 3 }, { w: 'agro', p: 3 },
      { w: 'hortaliza', p: 3 }, { w: 'plaga', p: 3 }, { w: 'manejo integrado', p: 3 }, { w: 'agricola', p: 3 },
      { w: 'campo', p: 1.5 }
    ],
    indicators: [
      'Kilogramos cosechados por hectárea por ciclo al final del proyecto.',
      '% de mejora en la productividad por hectárea respecto a la línea base.'
    ],
    verification: ['Registros de cosecha, informes de campo y reportes financieros anuales.'],
    assumptions: ['Las condiciones climáticas se mantienen dentro de rangos operativos.', 'El personal aplica las buenas prácticas de cultivo.']
  }
];

// Nivel -> campos que el algoritmo debe proponer
const SUGGEST_LEVELS = {
  'Objetivo': ['indicador', 'medios', 'supuesto'],
  'Objetivo general': ['indicador', 'medios', 'supuesto'],
  'Resultado': ['indicador', 'medios', 'supuesto'],
  'Actividad': ['medios']
};

function normalizeText(s){
  return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}

// Reconoce a qué se refiere un texto: devuelve { theme, score } o { theme:null }
function detectTheme(text){
  const norm = normalizeText(text);
  let best = null, bestScore = 0;
  for(const t of SUGGEST_THEMES){
    let score = 0;
    for(const { w, p } of t.keywords){
      const nk = normalizeText(w);
      if(norm.includes(nk)) score += p;
    }
    if(score > bestScore){ bestScore = score; best = t; }
  }
  return { theme: bestScore > 0 ? best : null, score: bestScore };
}

// Genera propsición (indicador / medios / supuesto) para una fila según su tema y nivel.
function proposeRow(row, label){
  const det = detectTheme(row.text || '');
  const theme = det.theme;
  const fields = SUGGEST_LEVELS[row.jerarquia] || [];
  const proposal = { indicador: '', medios: '', supuesto: '' };
  if(theme){
    if(fields.includes('indicador')){
      // elegir el indicador más relacionado: toma contexto del texto para variar la selección
      const norm = normalizeText(row.text||'');
      let pick = 0;
      if(norm.includes('capacidad')) pick = 0;
      else if(norm.includes('acceso')) pick = 0;
      else if(norm.includes('%')) pick = 0;
      proposal.indicador = theme.indicators[pick % theme.indicators.length];
    }
    if(fields.includes('medios')) proposal.medios = theme.verification[0];
    if(fields.includes('supuesto')) proposal.supuesto = theme.assumptions[0];
  } else {
    // Sin tema detectado: propuestas genéricas contextuales
    if(fields.includes('indicador')) proposal.indicador = (row.jerarquia === 'Resultado')
      ? `Número de ${cap(label)} alcanzados al final del proyecto.`
      : '% de avance de la meta al final del proyecto.';
    if(fields.includes('medios')) proposal.medios = 'Informes de seguimiento, registros oficiales y revisión documental.';
    if(fields.includes('supuesto')) proposal.supuesto = 'Los recursos necesarios se mantienen disponibles y los actores clave mantienen su compromiso.';
  }
  return { theme, themeLabel: theme ? theme.label : 'Tema no identificado', detScore: det.score, proposal };
}

// Analiza todo el marco y devuelve la lista de filas con su reconocimiento y propuesta.
function analyzeMarco(marco){
  const rows = (marco && Array.isArray(marco.rows)) ? marco.rows : [];
  if(rows.length === 0) return { rows: [], themesFound: [], empty: true };
  const labeled = marcoLabeledRows(rows).filter(x => x.level);
  const analyzed = labeled.map(({ label, row, level }) => {
    const { theme, themeLabel, detScore, proposal } = proposeRow(row, label);
    return {
      label, level, text: row.text, themeId: theme ? theme.id : null,
      themeLabel, detScore,
      current: { indicador: row.indicador||'', medios: row.medios||'', supuesto: row.supuesto||'' },
      proposal, applyable: (SUGGEST_LEVELS[level]||[]).length > 0
    };
  });
  const themesFound = Array.from(new Set(analyzed.map(r => r.themeLabel).filter(Boolean)));
  return { rows: analyzed, themesFound, empty: false };
}

// Rellena las celdas vacías de una fila con su propuesta.
function applySuggestion(marco, idx){
  const rows = (marco && Array.isArray(marco.rows)) ? marco.rows.map(r => ({...r})) : [];
  const labeledRows = marcoLabeledRows(rows).filter(x => x.level);
  const entry = labeledRows[idx];
  if(!entry) return marco;
  const { proposal } = proposeRow(entry.row, entry.label);
  const fields = SUGGEST_LEVELS[entry.level] || [];
  fields.forEach(f => {
    if((entry.row[f] === undefined || entry.row[f] === null || String(entry.row[f]).trim() === '') && proposal[f]){
      entry.row[f] = proposal[f];
    }
  });
  return { rows };
}

function applyAllSuggestions(marco){
  const rows = (marco && Array.isArray(marco.rows)) ? marco.rows.map(r => ({...r})) : [];
  const labeledRows = marcoLabeledRows(rows).filter(x => x.level);
  labeledRows.forEach((entry, idx) => {
    const { proposal } = proposeRow(entry.row, entry.label);
    const fields = SUGGEST_LEVELS[entry.level] || [];
    fields.forEach(f => {
      if((entry.row[f] === undefined || entry.row[f] === null || String(entry.row[f]).trim() === '') && proposal[f]){
        entry.row[f] = proposal[f];
      }
    });
  });
  return { rows };
}

function renderSuggestions(analysis, note){
  if(analysis.empty){
    return `
      <div class="panel">
        <div style="font-weight:700">Análisis del Marco Lógico</div>
        <div class="small">No hay filas registradas. Carga el ejemplo o importa un archivo con la estructura "marco.rows".</div>
      </div>`;
  }

  const themeTags = analysis.themesFound.map(t => `<span style="display:inline-block;background:#eef6f3;color:var(--accent);padding:3px 8px;border-radius:999px;font-size:12px;margin:2px">${escape(t)}</span>`).join('');

  const cards = analysis.rows.filter(r => r.applyable).map((r, i) => {
    const idx = analysis.rows.indexOf(r);
    const themeBadge = r.themeId
      ? `<span style="display:inline-block;background:#eef6f3;color:var(--accent);padding:2px 6px;border-radius:999px;font-size:11px">${escape(r.themeLabel)}</span>`
      : `<span style="display:inline-block;background:#f3f4f6;color:var(--muted);padding:2px 6px;border-radius:999px;font-size:11px">${escape(r.themeLabel)}</span>`;
    const field = (label, cur, proposed) => `
      <div style="margin-top:8px">
        <div class="small" style="font-weight:700">${label}</div>
        ${cur ? `<div class="small" style="margin-top:2px">Actual: ${escape(cur)}</div>` : ''}
        <div style="font-size:13px;margin-top:2px;color:#0b3f5d">${escape(proposed)}</div>
      </div>`;
    return `
      <div class="card" style="flex-direction:column;align-items:flex-start">
        <div style="width:100%;display:flex;justify-content:space-between;gap:8px;align-items:flex-start">
          <div>
            <div style="font-weight:700;color:var(--accent);font-size:12px;text-transform:uppercase">${escape(r.label)}</div>
            <div style="font-size:13px;margin-top:2px">${escape(r.text||'')}</div>
          </div>
          ${themeBadge}
        </div>
        ${field('Indicador sugerido', r.current.indicador, r.proposal.indicador)}
        ${field('Medios de verificación sugeridos', r.current.medios, r.proposal.medios)}
        ${field('Supuesto sugerido', r.current.supuesto, r.proposal.supuesto)}
        <button class="button ghost" data-act="suggest-apply" data-idx="${idx}" data-label="${escape(r.label)}" style="margin-top:10px">Aplicar sugerencias a ${escape(r.label)}</button>
      </div>`;
  }).join('<div style="height:8px"></div>');

  return `
    <div class="panel">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap">
        <div>
          <div style="font-weight:700">Análisis del Marco Lógico</div>
          <div class="small">El algoritmo reconoce a qué se refiere cada dato y propone indicador, medios de verificación y supuestos afines. Solo se rellenan las celdas vacías.</div>
        </div>
        <button class="button" data-act="suggest-apply-all">Aplicar todas</button>
      </div>
      <div style="margin-top:6px">
        <div class="small" style="font-weight:700">Temas reconocidos:</div>
        <div>${themeTags || '<span class="small">Ninguno identificado — se usarán propuestas genéricas.</span>'}</div>
      </div>
      ${note ? `<div class="tag" style="margin-top:8px">${escape(note)}</div>` : ''}
    </div>
    <div style="height:8px"></div>
    <div style="display:flex;flex-direction:column;gap:8px">${cards}</div>
  `;
}

function cap(s){
  s = String(s||'');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function downloadJSON(obj, filename){
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function escape(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }