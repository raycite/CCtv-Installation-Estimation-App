const STORAGE_KEY = 'fasttech-estimate-studio-v1';
const MATERIAL_CATALOG = Array.isArray(window.MATERIAL_CATALOG) ? window.MATERIAL_CATALOG : [];
const sample = {
  estimateNumber: 'FT-0001', estimateDate: '2026-10-19', estimateTitle: 'CCTV INSTALLATION',
  estimateSubtitle: 'COST ESTIMATE | 2 ANALOG CAMERAS + 4CH DVR',
  customerName: 'STAR CLUB SHOP', customerAddress: 'Opposite West Village, Asamankese',
  supplierName: 'TRUE MANUFACTURING & TRADING CO. LTD.', supplierDetails: 'FAST-TECH: 0554856486 / 0559633286',
  currency: 'GHS', installationFee: 1000,
  items: [
    ['2MP Smart Hybrid ColorVu Audio Analog Dome Camera', 2, 260],
    ['4-Channel DVR (4CH)', 1, 380],
    ['WESTEND DIGITAL 1TB HDD', 1, 580],
    ['DS-2FA1205-C8(UK)(O-STD) Power Supply', 1, 140],
    ['WESTA-3M HDMI CABLE 1.4V 1080P', 1, 15],
    ['WESTA CAT6 UTP INDOOR CCA 0.57MM (metres)', 100, 1.5],
    ['DC PIN CABLE MALE', 4, 3], ['VIDEO BALUN 8MP', 4, 16],
    ['13CM JUNCTION BOX WHITE', 4, 10], ['WESTA 4U CABINET 520 x 400 x 240', 1, 370],
    ['Router', 1, 600], ['SIM Card and Initial Data', 1, 150]
  ].map(([description, quantity, unitPrice]) => ({ description, quantity, unitPrice })),
  notes: [
    'Materials sourced from True Manufacturing and Trading Company Ltd.; prices based on supplier quotation.',
    'DVR updated to a 4-channel model at GHS 380; exact DVR model to be confirmed before procurement.',
    'One month complimentary support for minor settings adjustments and resets following installation.',
    'After one month, additional call-outs or onsite support attract a service fee.',
    'SIM/data renewals are excluded. Manufacturer/supplier equipment warranty terms apply.'
  ]
};

let model = load();
let saveTimer;
const $ = (id) => document.getElementById(id);
function load() {
  try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (parsed && Array.isArray(parsed.items)) return parsed; } catch (_) {}
  return structuredClone(sample);
}
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function money(value) {
  const amount = Number(value) || 0;
  try { return new Intl.NumberFormat('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount); }
  catch { return amount.toFixed(2); }
}
function dateLong(value) {
  if (!value) return 'Date not set';
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
}
function materialMatches(query) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return MATERIAL_CATALOG.filter((item) => {
    const searchable = [item.name, item.category, item.unit, ...(item.aliases || [])].join(' ').toLowerCase();
    return words.every((word) => searchable.includes(word));
  }).slice(0, 7);
}
function renderCatalogSuggestions(container, matches, activeIndex) {
  if (!matches.length) {
    container.innerHTML = '<p class="catalog-empty">No saved material found. Continue typing to add a custom item.</p>';
    container.hidden = false;
    return;
  }
  container.innerHTML = matches.map((item, matchIndex) => `
    <button class="catalog-option${matchIndex === activeIndex ? ' is-active' : ''}" type="button" role="option" aria-selected="${matchIndex === activeIndex}">
      <span class="catalog-option-name">${escapeHtml(item.name)}</span>
      <span class="catalog-option-meta">${escapeHtml(item.category)} · ${escapeHtml(item.unit)}</span>
    </button>`).join('');
  container.hidden = false;
}
function renderEditor() {
  const root = $('itemsEditor');
  root.innerHTML = model.items.length ? model.items.map((item, index) => `
    <div class="item-row" data-index="${index}">
      <div class="catalog-field">
        <input aria-label="Item ${index + 1} description" class="description-input" value="${escapeHtml(item.description)}" placeholder="Type a material or service" autocomplete="off" aria-autocomplete="list" aria-expanded="false" />
        <div class="catalog-suggestions" role="listbox" hidden></div>
      </div>
      <input aria-label="Item ${index + 1} quantity" class="qty-input" value="${escapeHtml(item.quantity)}" inputmode="decimal" />
      <input aria-label="Item ${index + 1} unit price" class="price-input" value="${escapeHtml(item.unitPrice)}" inputmode="decimal" placeholder="0.00" />
      <button type="button" class="remove-item" aria-label="Remove item ${index + 1}" title="Remove item">×</button>
    </div>`).join('') : '<div class="empty-row">No items yet. Add your first material below.</div>';
  root.querySelectorAll('.item-row').forEach((row) => {
    const index = Number(row.dataset.index);
    const descriptionInput = row.querySelector('.description-input');
    const suggestions = row.querySelector('.catalog-suggestions');
    let matches = [];
    let activeIndex = -1;
    const showMatches = () => {
      const query = descriptionInput.value.trim();
      if (query.length < 2) { suggestions.hidden = true; descriptionInput.setAttribute('aria-expanded', 'false'); return; }
      matches = materialMatches(query);
      renderCatalogSuggestions(suggestions, matches, activeIndex);
      descriptionInput.setAttribute('aria-expanded', 'true');
    };
    const hideMatches = () => { suggestions.hidden = true; descriptionInput.setAttribute('aria-expanded', 'false'); activeIndex = -1; };
    const choose = (item) => {
      model.items[index].description = item.name;
      descriptionInput.value = item.name;
      hideMatches(); renderPreview(); queueSave();
      row.querySelector('.price-input').focus();
    };
    descriptionInput.addEventListener('input', (e) => { model.items[index].description = e.target.value; activeIndex = -1; renderPreview(); queueSave(); showMatches(); });
    descriptionInput.addEventListener('focus', showMatches);
    descriptionInput.addEventListener('blur', () => setTimeout(hideMatches, 120));
    descriptionInput.addEventListener('keydown', (event) => {
      if (suggestions.hidden || !matches.length) return;
      if (event.key === 'ArrowDown') { event.preventDefault(); activeIndex = Math.min(activeIndex + 1, matches.length - 1); renderCatalogSuggestions(suggestions, matches, activeIndex); }
      if (event.key === 'ArrowUp') { event.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); renderCatalogSuggestions(suggestions, matches, activeIndex); }
      if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); choose(matches[activeIndex]); }
      if (event.key === 'Escape') { event.preventDefault(); hideMatches(); }
    });
    suggestions.addEventListener('mousedown', (event) => {
      const option = event.target.closest('.catalog-option');
      if (!option) return;
      event.preventDefault();
      choose(matches[Array.from(suggestions.querySelectorAll('.catalog-option')).indexOf(option)]);
    });
    row.querySelector('.qty-input').addEventListener('input', (e) => { model.items[index].quantity = e.target.value; renderPreview(); queueSave(); });
    row.querySelector('.price-input').addEventListener('input', (e) => { model.items[index].unitPrice = e.target.value; renderPreview(); queueSave(); });
    row.querySelector('.remove-item').addEventListener('click', () => { model.items.splice(index, 1); renderEditor(); renderPreview(); queueSave(); });
  });
}
function renderPreview() {
  $('paperTitle').textContent = model.estimateTitle || 'CCTV INSTALLATION';
  $('paperSubtitle').textContent = model.estimateSubtitle || 'COST ESTIMATE';
  $('paperCustomer').textContent = model.customerName || 'Customer name';
  $('paperAddress').textContent = model.customerAddress || 'Customer address';
  $('paperSupplier').textContent = model.supplierName || 'Supplier name';
  $('paperSupplierDetails').textContent = model.supplierDetails || 'Supplier contact details';
  $('paperEstimateNumber').textContent = `ESTIMATE # ${model.estimateNumber || '—'}`;
  $('paperDate').textContent = dateLong(model.estimateDate);
  $('footerEstimateNumber').textContent = model.estimateNumber || '—';
  $('footerDate').textContent = dateLong(model.estimateDate);
  document.querySelectorAll('.currency').forEach((node) => node.textContent = model.currency || 'GHS');
  const subtotal = model.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const itemsRoot = $('paperItems');
  itemsRoot.innerHTML = model.items.length ? model.items.map((item) => `<tr><td>${escapeHtml(item.description || '—')}</td><td>${escapeHtml(item.quantity || '0')}</td><td>${money(item.unitPrice)}</td><td>${money((Number(item.quantity)||0) * (Number(item.unitPrice)||0))}</td></tr>`).join('') : '<tr><td colspan="4" class="empty-row">Add materials to build your estimate.</td></tr>';
  $('paperSubtotal').textContent = money(subtotal);
  $('paperInstall').textContent = money(model.installationFee);
  $('paperGrandTotal').textContent = money(subtotal + (Number(model.installationFee) || 0));
  const notes = Array.isArray(model.notes) ? model.notes : String(model.notes || '').split(/\r?\n/);
  $('paperNotes').innerHTML = notes.filter((note) => String(note).trim()).map((note) => `<li>${escapeHtml(note)}</li>`).join('');
  if (!$('paperNotes').children.length) $('paperNotes').innerHTML = '<li>Thank you for your business.</li>';
}
function syncForm() {
  document.querySelectorAll('[data-field]').forEach((input) => {
    const value = model[input.dataset.field] ?? '';
    input.value = input.id === 'notes' && Array.isArray(value) ? value.join('\n') : value;
  });
  $('currencyLabel').textContent = model.currency || 'GHS';
  renderEditor(); renderPreview();
}
function queueSave() {
  $('saveStatus').textContent = 'Saving…';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(model)); $('saveStatus').textContent = 'All changes saved'; }
    catch { $('saveStatus').textContent = 'Could not save draft'; }
  }, 300);
}
document.querySelectorAll('[data-field]').forEach((input) => {
  input.addEventListener('input', () => {
    model[input.dataset.field] = input.type === 'number' ? Number(input.value) : input.value;
    if (input.id === 'currency') $('currencyLabel').textContent = input.value;
    renderPreview(); queueSave();
  });
  input.addEventListener('change', () => {
    model[input.dataset.field] = input.value;
    if (input.id === 'currency') $('currencyLabel').textContent = input.value;
    renderPreview(); queueSave();
  });
});
$('addItemBtn').addEventListener('click', () => { model.items.push({ description: '', quantity: 1, unitPrice: '' }); renderEditor(); renderPreview(); queueSave(); const fields = document.querySelectorAll('.description-input'); fields[fields.length - 1]?.focus(); });
$('downloadBtn').addEventListener('click', () => window.print());
$('mobileDownloadBtn').addEventListener('click', () => window.print());
$('newEstimateBtn').addEventListener('click', () => {
  if (!confirm('Start a new estimate? Your current saved estimate will be replaced.')) return;
  model = { ...structuredClone(sample), estimateNumber: `FT-${String(Date.now()).slice(-5)}`, estimateDate: new Date().toISOString().slice(0,10), customerName: '', customerAddress: '', items: [], installationFee: 0, notes: [] };
  syncForm(); queueSave(); window.scrollTo({ top: 0, behavior: 'smooth' });
});
$('resetBtn').addEventListener('click', () => {
  if (!confirm('Restore the original sample estimate? This replaces your current draft.')) return;
  model = structuredClone(sample); syncForm(); queueSave();
});
syncForm();
$('currentYear').textContent = new Date().getFullYear();
