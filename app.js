import { initCompany } from './components/company.js';
import { initCollection } from './components/collection.js';
import { initAnalysis } from './components/analysis.js';
import { initReports } from './components/reports.js';

const state = {
  company: load('lf_company') || {},
  collection: load('lf_collection') || { problems: [] },
  marco: load('lf_marco') || { rows: [] }
};

// Universal dialog utilities (promise-based) to replace alert/confirm/prompt
window.showMessage = function(message, title = 'Mensaje') {
  return new Promise(resolve => {
    createDialog({ title, message, buttons: [{ label: 'Aceptar', value: true }] }).then(() => resolve());
  });
};
window.showConfirm = function(message, title = 'Confirmar') {
  return createDialog({ title, message, buttons: [{ label: 'Cancelar', value: false }, { label: 'Aceptar', value: true }], defaultIndex: 1 });
};
window.showPrompt = function(message, defaultValue = '', title = 'Entrada') {
  return new Promise(resolve => {
    createDialog({ title, message, input: { value: defaultValue }, buttons: [{ label: 'Cancelar', value: null }, { label: 'Aceptar', value: 'ok' }], defaultIndex: 1 })
      .then(result => {
        // result will be object {button, inputValue}
        if (!result || result.button === null) return resolve(null);
        resolve(result.inputValue ?? null);
      });
  });
};

function createDialog(opts = {}) {
  // opts: { title, message, buttons:[{label,value}], input: {value}, defaultIndex }
  return new Promise(resolve => {
    const backdrop = document.createElement('div');
    backdrop.style.position = 'fixed';
    backdrop.style.inset = '0';
    backdrop.style.background = 'rgba(9,10,12,0.45)';
    backdrop.style.zIndex = 110;
    backdrop.style.display = 'flex';
    backdrop.style.alignItems = 'center';
    backdrop.style.justifyContent = 'center';

    const card = document.createElement('div');
    card.style.width = '92%';
    card.style.maxWidth = '520px';
    card.style.borderRadius = '10px';
    card.style.background = 'white';
    card.style.padding = '14px';
    card.style.boxShadow = '0 18px 40px rgba(8,10,12,0.28)';
    card.style.color = '#0b1220';
    card.style.fontFamily = 'Inter, Roboto, Arial, sans-serif';
    card.style.zIndex = 111;

    const ht = document.createElement('div');
    ht.style.display = 'flex';
    ht.style.justifyContent = 'space-between';
    ht.style.alignItems = 'center';
    ht.style.marginBottom = '8px';
    const h = document.createElement('div');
    h.style.fontWeight = 700;
    h.textContent = opts.title || '';
    ht.appendChild(h);
    const closeX = document.createElement('button');
    closeX.textContent = '✕';
    closeX.style.border = '0';
    closeX.style.background = 'transparent';
    closeX.style.fontSize = '16px';
    closeX.style.cursor = 'pointer';
    closeX.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });
    ht.appendChild(closeX);
    card.appendChild(ht);

    const msg = document.createElement('div');
    msg.style.color = '#374151';
    msg.style.fontSize = '14px';
    msg.style.marginBottom = '12px';
    if (opts.message instanceof Node) msg.appendChild(opts.message); else msg.textContent = opts.message || '';
    card.appendChild(msg);

    let inputEl = null;
    if (opts.input) {
      inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.value = opts.input.value ?? '';
      inputEl.style.width = '100%';
      inputEl.style.padding = '8px';
      inputEl.style.border = '1px solid #e6e9ee';
      inputEl.style.borderRadius = '8px';
      inputEl.style.marginBottom = '12px';
      card.appendChild(inputEl);
      setTimeout(()=> inputEl.focus(), 40);
    }

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.gap = '8px';

    const buttons = (opts.buttons || [{ label: 'Aceptar', value: true }]);
    buttons.forEach((b, idx) => {
      const btn = document.createElement('button');
      btn.textContent = b.label;
      btn.style.padding = '8px 12px';
      btn.style.borderRadius = '8px';
      btn.style.border = '0';
      btn.style.cursor = 'pointer';
      if (idx === (opts.defaultIndex ?? (buttons.length - 1))) {
        btn.style.background = 'linear-gradient(180deg,#ff8a3a,#db6717)';
        btn.style.color = 'white';
        btn.style.fontWeight = 700;
      } else {
        btn.style.background = '#f3f4f6';
        btn.style.color = '#0b5d3f';
      }
      btn.addEventListener('click', () => {
        const iv = inputEl ? inputEl.value : undefined;
        cleanup();
        // For confirm/prompt we return object with button and inputValue
        if (opts.input) resolve({ button: b.value, inputValue: iv });
        else resolve(b.value);
      });
      actions.appendChild(btn);
    });

    card.appendChild(actions);
    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    function cleanup(){
      if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
    }

    // keyboard handlers
    function onKey(e) {
      if (e.key === 'Escape') { cleanup(); resolve(null); document.removeEventListener('keydown', onKey); }
      if (e.key === 'Enter') {
        // trigger default
        const def = buttons[opts.defaultIndex ?? (buttons.length - 1)];
        if (def) {
          const iv = inputEl ? inputEl.value : undefined;
          cleanup();
          if (opts.input) resolve({ button: def.value, inputValue: iv });
          else resolve(def.value);
          document.removeEventListener('keydown', onKey);
        }
      }
    }
    document.addEventListener('keydown', onKey);
  });
}

function save(key, value){ localStorage.setItem(key, JSON.stringify(value)) }
function load(key){ try{ return JSON.parse(localStorage.getItem(key)) }catch(e){return null} }

const main = document.getElementById('mainView');
const menuBtns = Array.from(document.querySelectorAll('.menu-btn'));
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importInput = document.getElementById('importInput');
const clearBtn = document.getElementById('clearBtn');
const loadExampleBtn = document.getElementById('loadExampleBtn');

let currentView = null;

function setActive(name){
  menuBtns.forEach(b => b.classList.toggle('active', b.dataset.view === name));
}

function render(view){
  main.innerHTML = '';
  currentView = view;
  setActive(view);

  if(view === 'company'){
    initCompany(main, state.company, updated => {
      state.company = updated;
      save('lf_company', state.company);
    });
  } else if(view === 'collection'){
    initCollection(main, state.collection, updated => {
      state.collection = updated;
      save('lf_collection', state.collection);
    });
  } else if(view === 'analysis'){
    initAnalysis(main, state, {
      saveCompany: c => { state.company = c; save('lf_company', c) },
      saveCollection: c => { state.collection = c; save('lf_collection', c) }
    });
  } else if(view === 'reports'){
    initReports(main, state, {
      saveCompany: c => { state.company = c; save('lf_company', c) },
      saveCollection: c => { state.collection = c; save('lf_collection', c) },
      saveMarco: c => { state.marco = c; save('lf_marco', c) }
    });
  }
}

menuBtns.forEach(b => b.addEventListener('click', () => render(b.dataset.view)));

exportBtn.addEventListener('click', () => {
  const data = { company: state.company, collection: state.collection, marco: state.marco, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `logical-framework-export-${Date.now()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', () => importInput.click());
importInput.addEventListener('change', ev => {
  const file = ev.target.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try{
      const parsed = JSON.parse(reader.result);
      if(parsed.company) { state.company = parsed.company; save('lf_company', state.company); }
      if(parsed.collection) { state.collection = parsed.collection; save('lf_collection', state.collection); }
      if(parsed.marco) { state.marco = parsed.marco; save('lf_marco', state.marco); }
      render(currentView || 'company');
      await window.showMessage('Importación completada.', 'Importar');
    }catch(e){ await window.showMessage('Archivo inválido.', 'Error') }
  };
  reader.readAsText(file);
  importInput.value = '';
});

clearBtn.addEventListener('click', async () => {
  const ok = await window.showConfirm('Borrar todos los datos guardados localmente?', 'Borrar datos');
  if(ok){
    localStorage.removeItem('lf_company');
    localStorage.removeItem('lf_collection');
    localStorage.removeItem('lf_marco');
    state.company = {};
    state.collection = { problems: [] };
    state.marco = { rows: [] };
    render('company');
  }
});

/* Example data loader: comprehensive sample to illustrate company, problems, causes, effects and links */
async function loadExampleData(){
  const sample = {
    company: {
      name: "AgroPro S.A.",
      sector: "Agroindustria - Horticultura",
      location: "Valle Verde, País Ejemplo",
      size: "38",
      description: "Empresa productora y comercializadora de hortalizas con enfoque en mercados locales y exportación regional. Opera invernaderos y centros de empaque; enfrenta retos de productividad, comercialización y retención de talento."
    },
    collection: {
      problems: [
        // problems with explicit codes for traceability (P/C/E + index)
        { id: "p1", code: "P1", title: "Baja productividad por ciclo", type: "problema", createdAt: "2026-01-10T09:00:00Z", links: ["c1","c2","e1"] },
        { id: "c1", code: "C1", title: "Falta de capacitación técnica del personal", type: "causa", createdAt: "2026-01-10T09:05:00Z", links: [] },
        { id: "c2", code: "C2", title: "Equipos de riego y clima con mantenimiento deficiente", type: "causa", createdAt: "2026-01-10T09:07:00Z", links: [] },
        { id: "c3", code: "C3", title: "Escasa adopción de prácticas de manejo integrado de plagas", type: "causa", createdAt: "2026-01-10T09:09:00Z", links: [] },
        { id: "e1", code: "E1", title: "Aumento de costos operativos", type: "efecto", createdAt: "2026-01-10T09:12:00Z", links: [] },
        { id: "e2", code: "E2", title: "Pérdida de contratos con compradores por inconsistencia de calidad", type: "efecto", createdAt: "2026-01-10T09:14:00Z", links: [] },
        { id: "p2", code: "P2", title: "Rotación elevada de personal clave", type: "problema", createdAt: "2026-01-10T09:20:00Z", links: ["c4","e3"] },
        { id: "c4", code: "C4", title: "Compensación y beneficios insuficientes", type: "causa", createdAt: "2026-01-10T09:22:00Z", links: [] },
        { id: "e3", code: "E3", title: "Pérdida de conocimiento operativo", type: "efecto", createdAt: "2026-01-10T09:25:00Z", links: [] },
        { id: "p3", code: "P3", title: "Baja presencia en canales de venta modernos", type: "problema", createdAt: "2026-01-10T09:30:00Z", links: ["c5","e4"] },
        { id: "c5", code: "C5", title: "Estrategia comercial limitada y poca digitalización", type: "causa", createdAt: "2026-01-10T09:32:00Z", links: [] },
        { id: "e4", code: "E4", title: "Crecimiento de ventas estancado", type: "efecto", createdAt: "2026-01-10T09:35:00Z", links: [] }
      ]
    },
    // Informe Marco Lógico: plantilla de 4 columnas (Jerarquía de objetivos / Indicador / Medios de verificación / Supuesto)
    // Cada fila del nivel "Resultado" y "Objetivo" exige indicador, medios de verificación y supuesto para que el informe pueda generarse.
    marco: {
      rows: [
        {
          jerarquia: "Objetivo general",
          text: "Incrementar la productividad y competitividad sostenible de AgroPro en mercados locales y de exportación.",
          indicador: "Productividad por hectárea y rentabilidad neta al cierre del periodo de gestión.",
          medios: "Informes de producción, reportes financieros anuales.",
          supuesto: ""
        },
        {
          jerarquia: "Objetivo",
          text: "Mejorar la productividad por ciclo de cultivo.",
          indicador: "1.1 Kilogramos cosechados por hectárea por ciclo.",
          medios: "Registros de cosecha e informes de campo.",
          supuesto: "Las condiciones climáticas se mantienen dentro de rangos operativos."
        },
        {
          jerarquia: "Objetivo",
          text: "Reducir la rotación de personal clave y retener el conocimiento operativo.",
          indicador: "2.1 % de reducción en la tasa de rotación anual de personal con rol clave.",
          medios: "Reportes de recursos humanos y encuestas de clima laboral.",
          supuesto: "El mercado laboral local no cambia de forma inesperada las expectativas salariales."
        },
        {
          jerarquia: "Objetivo",
          text: "Ampliar la presencia en canales de venta modernos.",
          indicador: "3.1 % de crecimiento de las ventas a través de canales de venta modernos y digitales.",
          medios: "Reportes de ventas por canal y seguimiento comercial.",
          supuesto: "Los distribuidores y plataformas mantienen condiciones de acceso estables."
        },
        {
          jerarquia: "Resultado",
          text: "Personal técnico capacitado en mantenimiento de equipos y cultivos.",
          indicador: "1.1.1 Número de operadores formados que aprueban la evaluación de destrezas técnicas.",
          medios: "Hojas de asistencia, evaluaciones previas y posteriores.",
          supuesto: "El personal permanece en sus puestos y aplica los conocimientos adquiridos."
        },
        {
          jerarquia: "Resultado",
          text: "Programa de mantenimiento preventivo de riego y climatización operativo.",
          indicador: "1.1.2 % de equipos con mantenimiento preventivo ejecutado según cronograma.",
          medios: "Expedientes técnicos y fichas de mantenimiento.",
          supuesto: "Los repuestos están disponibles en el mercado local."
        },
        {
          jerarquia: "Resultado",
          text: "Esquema de compensación y beneficios competitivo aplicado.",
          indicador: "2.1.1 % de personal clave cubierto por el nuevo esquema de beneficios.",
          medios: "Políticas de RH firmadas y nóminas.",
          supuesto: "No se produce un conflicto laboral externo que afecte el plan."
        },
        {
          jerarquia: "Resultado",
          text: "Estrategia comercial digital implementada.",
          indicador: "3.1.1 Número de canales de venta modernos activos al cierre del proyecto.",
          medios: "Informes comerciales y analítica digital.",
          supuesto: "La conectividad y el acceso a plataformas se mantienen estables."
        },
        {
          jerarquia: "Actividad",
          text: "Elaboración del plan de formación técnica del personal basado en la evaluación de necesidades.",
          indicador: "",
          medios: "",
          supuesto: ""
        },
        {
          jerarquia: "Actividad",
          text: "Contratación de un proveedor externo para el mantenimiento preventivo de los equipos.",
          indicador: "",
          medios: "",
          supuesto: ""
        },
        {
          jerarquia: "Actividad",
          text: "Diseño e implementación del nuevo esquema de compensación y beneficios.",
          indicador: "",
          medios: "",
          supuesto: ""
        },
        {
          jerarquia: "Actividad",
          text: "Desarrollo del plan comercial y activación de los canales de venta digitales.",
          indicador: "",
          medios: "",
          supuesto: ""
        }
      ]
    }
  };

  state.company = sample.company;
  state.collection = sample.collection;
  state.marco = sample.marco;
  save('lf_company', state.company);
  save('lf_collection', state.collection);
  save('lf_marco', state.marco);
  render('collection');
  await window.showMessage('Datos de ejemplo cargados. Revisa Informes > "Marco Lógico" para ver el informe en formato de plantilla.', 'Ejemplo cargado');
}

if(loadExampleBtn){
  loadExampleBtn.addEventListener('click', async () => {
    const ok = await window.showConfirm('¿Cargar datos de ejemplo? Esto reemplazará los datos actuales en la sesión.', 'Cargar ejemplo');
    if(!ok) return;
    loadExampleData();
  });
}

// Initialize default view
render('company');

// Help modal controls
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const helpClose = document.getElementById('helpClose');
const helpBackdrop = document.getElementById('helpBackdrop');

function openHelp(){
  if(!helpModal) return;
  helpModal.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  // focus trap: move focus to close button
  setTimeout(()=>helpClose?.focus?.(),120);
}

function closeHelp(){
  if(!helpModal) return;
  helpModal.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  helpBtn?.focus?.();
}

helpBtn?.addEventListener('click', openHelp);
helpClose?.addEventListener('click', closeHelp);
helpBackdrop?.addEventListener('click', closeHelp);
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape' && helpModal && helpModal.getAttribute('aria-hidden') === 'false') closeHelp();
});