export function initCompany(container, company = {}, onChange = () => {}) {
  const el = document.createElement('div');
  el.className = 'panel';
  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
      <div>
        <h3 style="margin:0">Datos de la empresa</h3>
        <div class="small">Información básica y de contexto para el análisis</div>
      </div>
      <div class="tag">Guardado local</div>
    </div>

    <div style="height:12px"></div>

    <div class="form-grid">
      <div>
        <label>Nombre de la empresa</label>
        <input id="c_name" type="text" value="${escape(company.name||'')}" />
      </div>
      <div>
        <label>Sector productivo</label>
        <input id="c_sector" type="text" value="${escape(company.sector||'')}" />
      </div>

      <div>
        <label>Ubicación (ciudad/país)</label>
        <input id="c_location" type="text" value="${escape(company.location||'')}" />
      </div>

      <div>
        <label>Tamaño (empleados)</label>
        <input id="c_size" type="text" value="${escape(company.size||'')}" />
      </div>

      <div class="full">
        <label>Descripción breve</label>
        <textarea id="c_desc">${escape(company.description||'')}</textarea>
      </div>
    </div>

    <div class="actions" style="margin-top:12px">
      <button id="save" class="button">Guardar</button>
      <button id="reset" class="button ghost">Restablecer</button>
    </div>
  `;

  container.appendChild(el);

  const getCurrent = () => ({
    name: el.querySelector('#c_name').value.trim(),
    sector: el.querySelector('#c_sector').value.trim(),
    location: el.querySelector('#c_location').value.trim(),
    size: el.querySelector('#c_size').value.trim(),
    description: el.querySelector('#c_desc').value.trim()
  });

  el.querySelector('#save').addEventListener('click', async () => {
    const data = getCurrent();
    onChange(data);
    await window.showMessage('Datos de la empresa guardados.', 'Guardar');
  });

  el.querySelector('#reset').addEventListener('click', async () => {
    const ok = await window.showConfirm('Restablecer formulario a vacío?', 'Restablecer');
    if(!ok) return;
    el.querySelector('#c_name').value = '';
    el.querySelector('#c_sector').value = '';
    el.querySelector('#c_location').value = '';
    el.querySelector('#c_size').value = '';
    el.querySelector('#c_desc').value = '';
    onChange({});
  });
}

function escape(str){
  return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}