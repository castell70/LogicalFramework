export function initAnalysis(container, state, helpers = {}) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <h3 style="margin:0">Análisis</h3>
        <div class="small">Herramientas para generar el marco lógico y el árbol de problemas. (Interfaz profesional para análisis)</div>
      </div>
      <div class="tag"></div>
    </div>

    <div style="height:12px"></div>

    <div class="card" id="summaryCard" style="flex-direction:column;align-items:flex-start">
      <div style="display:flex;justify-content:space-between;width:100%;gap:12px">
        <div>
          <div style="font-weight:600">${escape(state.company.name||'Sin nombre')}</div>
          <div class="meta">${escape(state.company.sector||'Sin sector')} • ${escape(state.company.location||'')}</div>
        </div>
        <div style="text-align:right">
          <div class="small">Elementos registrados</div>
          <div style="font-weight:700;font-size:18px">${state.collection.problems?.length || 0}</div>
        </div>
      </div>
      <div style="height:12px"></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button id="generateLF" class="button">Generar borrador Marco Lógico</button>
        <button id="viewTree" class="button ghost">Ver árbol simplificado</button>
        <button id="viewGraphic" class="button secondary" style="background:#eef6f2;color:var(--accent);border:1px solid rgba(11,93,63,0.06)">Ver árbol</button>
      </div>
    </div>

    <div id="outputArea" style="margin-top:12px"></div>
  `;

  container.appendChild(el);

  const out = el.querySelector('#outputArea');
  const genBtn = el.querySelector('#generateLF');
  const viewBtn = el.querySelector('#viewTree');
  const viewGraphicBtn = el.querySelector('#viewGraphic');

  genBtn.addEventListener('click', () => {
    const lf = buildLogicalFramework(state.company, state.collection);
    out.innerHTML = renderLF(lf);
  });

  viewBtn.addEventListener('click', () => {
    out.innerHTML = renderTree(state.collection);
  });

  viewGraphicBtn.addEventListener('click', () => {
    out.innerHTML = renderGraphicTree(state.collection);
  });
}

function buildLogicalFramework(company, collection){
  // Minimal, pragmatic mapping: identify main problem (first 'problema' or first item), group causes/effects.
  const problems = collection.problems || [];
  const main = problems.find(p=>p.type==='problema') || problems[0] || null;
  const causes = problems.filter(p=>p.type==='causa');
  const effects = problems.filter(p=>p.type==='efecto');

  // Simple objectives: convert problems->objectives by inversion of text (placeholder)
  const specificObjectives = (causes.slice(0,6).map((c,i)=>({
    id: c.id, objective: `Reducir / mitigar: ${c.title}`
  })));

  const expectedResults = (effects.slice(0,6).map((e,i)=>({
    id: e.id, result: `Mejorar / eliminar: ${e.title}`
  })));

  return {
    projectTitle: company.name || 'Proyecto sin título',
    context: { sector: company.sector||'', location: company.location||'', size: company.size||'' },
    problem: main ? main.title : '',
    overallObjective: main ? `Eliminar o reducir: ${main.title}` : '',
    specificObjectives,
    expectedResults,
    assumptions: ['Condición 1: compromiso de stakeholders', 'Condición 2: recursos financieros']
  };
}

function renderLF(lf){
  return `
    <div class="panel">
      <h4 style="margin:0 0 8px 0">${escape(lf.projectTitle)}</h4>
      <div class="small">Objetivo general</div>
      <div style="font-weight:700;margin:6px 0">${escape(lf.overallObjective)}</div>

      <div style="height:8px"></div>

      <div>
        <div class="small">Objetivos específicos</div>
        <ul>
          ${lf.specificObjectives.map(o=>`<li>${escape(o.objective)}</li>`).join('')}
        </ul>
      </div>

      <div style="height:8px"></div>

      <div>
        <div class="small">Resultados esperados</div>
        <ul>
          ${lf.expectedResults.map(r=>`<li>${escape(r.result)}</li>`).join('')}
        </ul>
      </div>

      <div style="height:8px"></div>

      <div>
        <div class="small">Supuestos</div>
        <ul>${lf.assumptions.map(a=>`<li>${escape(a)}</li>`).join('')}</ul>
      </div>
    </div>
  `;
}

function renderTree(collection){
  const items = collection.problems || [];
  if(items.length===0) return `<div class="small">No hay datos para mostrar.</div>`;

  // Build id->item map and provide resolver that accepts either id or code
  const map = new Map(items.map(i=>[i.id,i]));
  function resolveRef(ref){
    if(!ref) return null;
    const byId = map.get(ref);
    if(byId) return byId;
    for(const v of items){
      if(v.code && String(v.code) === String(ref)) return v;
    }
    return null;
  }

  // Compute a simple "complexity" score:
  function complexityFor(item){
    const linksCount = (item.links || []).length;
    const typeWeight = item.type === 'problema' ? 2 : (item.type === 'causa' ? 1 : 0.5);
    const ageBoost = item.createdAt ? (Date.now() - new Date(item.createdAt).getTime()) / (1000*60*60*24*365) : 0;
    return linksCount * 1.1 + typeWeight + Math.min(ageBoost, 1) * 0.25;
  }

  // helper: try to extract numeric suffix from codes like 'P1','C12','E3' and use it for ordering;
  // fallback to complexity score and original insertion order to keep stable layout
  function numericFromCode(it){
    if(!it) return NaN;
    const code = it.code || '';
    const m = String(code).match(/(\d+)$/);
    if(m) return Number(m[1]);
    return NaN;
  }
  function sortByCodeThenComplex(a,b){
    const na = numericFromCode(a), nb = numericFromCode(b);
    if(!Number.isNaN(na) || !Number.isNaN(nb)){
      if(Number.isNaN(na)) return 1;
      if(Number.isNaN(nb)) return -1;
      if(na !== nb) return na - nb;
    }
    // fallback to complexity descending to keep prominent items first
    return b._c - a._c;
  }

  const efectos = items.filter(i => i.type === 'efecto').map(i => ({...i, _c: complexityFor(i)})).sort(sortByCodeThenComplex);
  const problemas = items.filter(i => i.type === 'problema').map(i => ({...i, _c: complexityFor(i)})).sort(sortByCodeThenComplex);
  const causas = items.filter(i => i.type === 'causa').map(i => ({...i, _c: complexityFor(i)})).sort(sortByCodeThenComplex);

  function renderCard(it){
    const links = (it.links||[]).map(ref => {
      const t = resolveRef(ref);
      return t ? (t.code || t.title || ref) : ref;
    }).join(' ↦ ');
    const borderColor = it.type === 'problema' ? '#0b5d3f' : (it.type === 'causa' ? '#b45309' : '#065f46');
    return `
      <div class="card" style="flex-direction:column;align-items:flex-start;padding:10px;border-color:${borderColor};min-width:140px;max-width:260px;flex:0 1 220px;box-sizing:border-box">
        <div style="font-weight:700;font-size:13px;word-break:break-word;line-height:1.15">${escape(it.title)} <span class="small">(${escape(it.type)})</span></div>
        <div class="small" style="margin-top:6px;word-break:break-word">Conexiones: ${links || '—'}</div>
        <div class="small" style="margin-top:6px;opacity:0.8">C: ${it._c.toFixed(2)}</div>
      </div>`;
  }

  function renderRow(title, arr){
    if(arr.length === 0) return `<div style="width:100%"><div class="small">${title}</div><div class="small">— Ninguno —</div></div>`;
    const cards = arr.map(it => renderCard(it)).join('');
    return `
      <div style="width:100%;display:flex;flex-direction:column;gap:8px;align-items:stretch">
        <div class="small" style="font-weight:700">${title}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-start;width:100%">${cards}</div>
      </div>`;
  }

  const html = `
    <div style="display:flex;flex-direction:column;gap:12px;align-items:stretch">
      ${renderRow('Efectos (ramas - arriba)', efectos)}
      ${renderRow('Problemas (tronco - centro)', problemas)}
      ${renderRow('Causas (raíces - abajo)', causas)}
    </div>

    <div style="height:8px"></div>

    <div class="small">Vista: las causas se consideran la raíz (abajo), los problemas forman el tronco (centro) y los efectos las ramas (arriba); tarjetas reducidas para mejor ajuste.</div>
  `;
  return html;
}

function escape(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

/* New: renderGraphicTree - draws a simple SVG tree silhouette and places items:
   - causas in roots (bottom), problemas around trunk (center), efectos in branches (top).
   The layout is responsive and aims for legible labels on mobile/iframe. */
function renderGraphicTree(collection){
  const items = collection.problems || [];
  if(items.length === 0) return `<div class="small">No hay datos para mostrar.</div>`;

  // Keep code-ordering for each set
  const causas = items.filter(i => i.type === 'causa').slice().sort((a,b) => {
    const ma = a.code?.match(/(\d+)$/)?.[1]; const mb = b.code?.match(/(\d+)$/)?.[1];
    if(ma || mb){ if(!ma) return 1; if(!mb) return -1; return Number(ma) - Number(mb); }
    return 0;
  });
  const problemas = items.filter(i => i.type === 'problema').slice().sort((a,b) => {
    const ma = a.code?.match(/(\d+)$/)?.[1]; const mb = b.code?.match(/(\d+)$/)?.[1];
    if(ma || mb){ if(!ma) return 1; if(!mb) return -1; return Number(ma) - Number(mb); }
    return 0;
  });
  const efectos = items.filter(i => i.type === 'efecto').slice().sort((a,b) => {
    const ma = a.code?.match(/(\d+)$/)?.[1]; const mb = b.code?.match(/(\d+)$/)?.[1];
    if(ma || mb){ if(!ma) return 1; if(!mb) return -1; return Number(ma) - Number(mb); }
    return 0;
  });

  // label block generator — flexible size that adapts to content
  function labelHTML(it, color){
    const safeTitle = escape(it.title);
    const code = it.code ? ` <span class="small">(${escape(it.code)})</span>` : '';
    return `<div style="font-family:inherit;color:${color};font-size:13px;padding:8px;border-radius:8px;background:rgba(255,255,255,0.98);box-shadow:0 8px 20px rgba(8,10,12,0.06);max-width:100%;word-break:break-word;display:inline-block">${safeTitle}${code}</div>`;
  }

  // Build grid rows for each type: each row uses CSS grid with columns = number of items (min 1)
  function buildGridRow(arr, color, ariaLabel){
    const count = Math.max(1, arr.length);
    // limit columns visually for very large counts but allow wrapping; use auto columns with minmax
    const gridStyle = `display:grid;grid-template-columns:repeat(${count},minmax(0,1fr));gap:8px;align-items:start;justify-items:center;padding:8px;width:100%`;
    const cells = (arr.length ? arr : [{ id: '__empty' }]).map(it => {
      if(it.id === '__empty') return `<div style="opacity:0.7" class="small">— Ninguno —</div>`;
      const lbl = labelHTML(it,color);
      // each cell centers content and allows label to size to its content without overflowing column
      return `<div style="width:100%;display:flex;justify-content:center;align-items:flex-start">${lbl}</div>`;
    }).join('\n');
    return `<div role="group" aria-label="${ariaLabel}" style="${gridStyle}">${cells}</div>`;
  }

  // Image and overlay container: position three grid rows vertically (efectos top, problemas center, causas bottom)
  const imgHtml = `<img src="/Arbol de problemas.png" alt="Árbol de problemas" style="width:100%;height:360px;object-fit:contain;border-radius:8px;display:block">`;

  const legend = `
    <div style="display:flex;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap">
      <div class="small" style="font-weight:700">Leyenda:</div>
      <div style="display:flex;gap:6px;align-items:center"><div style="width:12px;height:12px;background:#a84f11;border-radius:3px"></div><div class="small">Causas (raíces)</div></div>
      <div style="display:flex;gap:6px;align-items:center"><div style="width:12px;height:12px;background:#3b793f;border-radius:3px"></div><div class="small">Problemas (tronco)</div></div>
      <div style="display:flex;gap:6px;align-items:center"><div style="width:12px;height:12px;background:#0b5d3f;border-radius:3px"></div><div class="small">Efectos (ramas)</div></div>
    </div>
  `;

  // Compose three rows and absolutely position them so they align visually with the tree silhouette.
  // Rows are pointer-events: none on container, but cells keep interactive text selectable if needed.
  const rowE = buildGridRow(efectos, '#0b5d3f', 'Efectos (ramas)');
  const rowP = buildGridRow(problemas, '#3b793f', 'Problemas (tronco)');
  const rowC = buildGridRow(causas, '#a84f11', 'Causas (raíces)');

  // vertical positions in percent to place rows roughly aligned with image features; keeps labels close to tree
  const topPct = 18;   // efectos
  const midPct = 48;   // problemas
  const botPct = 76;   // causas

  // container uses absolute-positioned rows; each row's inner grid will distribute columns evenly and adapt label sizes
  const overlaysHtml = `
    <div style="position:absolute;inset:0;pointer-events:none;display:block">
      <div style="position:absolute;left:50%;top:${topPct}%;transform:translate(-50%,-50%);width:92%">${rowE}</div>
      <div style="position:absolute;left:50%;top:${midPct}%;transform:translate(-50%,-50%);width:92%">${rowP}</div>
      <div style="position:absolute;left:50%;top:${botPct}%;transform:translate(-50%,-50%);width:92%">${rowC}</div>
    </div>
  `;

  return `
    <div class="panel" style="padding:8px;overflow:auto">
      <div style="position:relative;width:100%;max-width:100%;height:360px">
        ${imgHtml}
        ${overlaysHtml}
      </div>
      ${legend}
    </div>
  `;
}