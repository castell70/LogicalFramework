export function initAnalysis(container, state, helpers = {}) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>
        <h3 style="margin:0">Análisis</h3>
        <div class="small">Herramientas para generar el marco lógico y el árbol de problemas. (Interfaz profesional para análisis)</div>
      </div>
      <div class="tag">Próximamente</div>
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
  // produce a simple adjacency list visualization (textual) suitable for quick review
  const map = new Map(items.map(i=>[i.id,i]));
  const rows = items.map(i=>{
    const links = (i.links||[]).map(id => map.get(id)?.title || id).join(' ↦ ');
    return `<div class="card" style="flex-direction:column;align-items:flex-start">
      <div style="font-weight:600">${escape(i.title)} <span class="small">(${escape(i.type)})</span></div>
      <div class="small" style="margin-top:6px">Conexiones: ${links || '—'}</div>
    </div>`;
  }).join('');
  return `<div style="display:flex;flex-direction:column;gap:8px">${rows}</div>`;
}

function escape(s){ return String(s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }