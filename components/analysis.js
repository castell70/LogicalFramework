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
      <div style="display:flex;gap:8px">
        <button id="generateLF" class="button">Generar borrador Marco Lógico</button>
        <button id="viewTree" class="button ghost">Ver árbol simplificado</button>
      </div>
    </div>

    <div id="outputArea" style="margin-top:12px"></div>
  `;

  container.appendChild(el);

  const out = el.querySelector('#outputArea');
  const genBtn = el.querySelector('#generateLF');
  const viewBtn = el.querySelector('#viewTree');

  genBtn.addEventListener('click', () => {
    const lf = buildLogicalFramework(state.company, state.collection);
    out.innerHTML = renderLF(lf);
  });

  viewBtn.addEventListener('click', () => {
    out.innerHTML = renderTree(state.collection);
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

  // Build id->item map
  const map = new Map(items.map(i=>[i.id,i]));

  // Compute a simple "complexity" score:
  // base: number of links (outgoing), plus weight by type (causa:1, problema:2, efecto:0.5)
  function complexityFor(item){
    const linksCount = (item.links || []).length;
    const typeWeight = item.type === 'problema' ? 2 : (item.type === 'causa' ? 1 : 0.5);
    const ageBoost = item.createdAt ? (Date.now() - new Date(item.createdAt).getTime()) / (1000*60*60*24*365) : 0;
    return linksCount * 1.1 + typeWeight + Math.min(ageBoost, 1) * 0.25;
  }

  // Group items into three tiers: efectos (top), causas (middle), problemas (bottom/root)
  const efectos = items.filter(i => i.type === 'efecto').map(i => ({...i, _c: complexityFor(i)})).sort((a,b) => b._c - a._c);
  const causas = items.filter(i => i.type === 'causa').map(i => ({...i, _c: complexityFor(i)})).sort((a,b) => b._c - a._c);
  const problemas = items.filter(i => i.type === 'problema').map(i => ({...i, _c: complexityFor(i)})).sort((a,b) => b._c - a._c);

  // Render a compact card; smaller sizes for tree view to fit mobile/iframe
  function renderCard(it){
    const links = (it.links||[]).map(id => {
      const t = map.get(id);
      return t ? (t.code || t.title || id) : id;
    }).join(' ↦ ');
    // remove dynamic scaling to avoid overlap; use constrained responsive card sizing
    const borderColor = it.type === 'problema' ? '#0b5d3f' : (it.type === 'causa' ? '#b45309' : '#065f46');
    return `
      <div class="card" style="flex-direction:column;align-items:flex-start;padding:10px;border-color:${borderColor};min-width:140px;max-width:260px;flex:0 1 220px;box-sizing:border-box">
        <div style="font-weight:700;font-size:13px;word-break:break-word;line-height:1.15">${escape(it.title)} <span class="small">(${escape(it.type)})</span></div>
        <div class="small" style="margin-top:6px;word-break:break-word">Conexiones: ${links || '—'}</div>
        <div class="small" style="margin-top:6px;opacity:0.8">C: ${it._c.toFixed(2)}</div>
      </div>`;
  }

  // Helper to render a horizontal row of items; allow wrapping into multiple lines and align start so items don't overlap
  function renderRow(title, arr){
    if(arr.length === 0) return `<div style="width:100%"><div class="small">${title}</div><div class="small">— Ninguno —</div></div>`;
    const cards = arr.map(it => renderCard(it)).join('');
    return `
      <div style="width:100%;display:flex;flex-direction:column;gap:8px;align-items:stretch">
        <div class="small" style="font-weight:700">${title}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-start;width:100%">${cards}</div>
      </div>`;
  }

  // Vertical layout: effects (top), causes (middle), problems (bottom). Each row adapts to space so three levels are visible.
  const html = `
    <div style="display:flex;flex-direction:column;gap:12px;align-items:stretch">
      ${renderRow('Efectos (canopy - arriba)', efectos)}
      ${renderRow('Causas (tronco - centro)', causas)}
      ${renderRow('Problemas (raíz - abajo)', problemas)}
    </div>

    <div style="height:8px"></div>

    <div class="small">Vista: los problemas se colocan abajo como raíz, las causas en el tronco y los efectos arriba; tarjetas reducidas para mejor ajuste.</div>
  `;
  return html;
}

function escape(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }