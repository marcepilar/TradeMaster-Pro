'use strict';
const $ = (id) => document.getElementById(id);
const SAVE_KEY = 'trademaster-pro-state-v1';
let lang = 'es';
let direction = 'long';
let currentTab = 'calc';
const translations = {
  es: {
    tab_calc:'Calculadora', tab_risk:'Gestión de Riesgo', margin:'Margen (USDT)', leverage:'Apalancamiento',
    leverage_desired:'Apalancamiento Deseado', entry_price:'Precio Entrada', liq_price:'Precio Liq. (est.)',
    take_profit:'Take Profit', stop_loss:'Stop Loss', liq_alert_title:'¡Cuidado! Riesgo de liquidación.',
    liq_alert_desc:'Tu Stop Loss está más allá del precio de liquidación estimado.',
    include_fees:'Incluir comisiones (0,04 % por lado, estimado)', profit_tp:'Ganancia (TP)',
    loss_sl:'Pérdida (SL)', net:'Neto', no_fees:'Sin comisiones',
    risk_desc:'Calculá el tamaño de la posición según cuánto estás dispuesto a arriesgar.',
    balance:'Balance Cuenta (USDT)', risk_amt:'Riesgo ($)', margin_required:'Margen Requerido',
    lev_guideline:'Límite orientativo', lev_warning:'Atención: apalancamiento elevado',
    no_guideline:'No hay un apalancamiento dentro del margen orientativo para ese SL',
    position:'Tamaño de posición', insufficient:'El margen requerido supera el saldo de la cuenta.',
    price_warning:'Usá precios positivos y un apalancamiento entre 1x y 125x.',
    ad_space:'ESPACIO PUBLICIDAD', fee_liq:'Posible liquidación antes del Stop Loss',
    calc_disclaimer:'El precio de liquidación es orientativo: no incluye margen de mantenimiento, funding ni reglas específicas del exchange. No utilices esta estimación como precio real de liquidación.',
    risk_disclaimer:'Cálculo orientativo sin comisiones ni deslizamiento. El apalancamiento no reduce el riesgo monetario de la posición: solo cambia el margen necesario.'
  },
  en: {
    tab_calc:'Calculator', tab_risk:'Risk Manager', margin:'Margin (USDT)', leverage:'Leverage',
    leverage_desired:'Desired Leverage', entry_price:'Entry Price', liq_price:'Est. Liq. Price',
    take_profit:'Take Profit', stop_loss:'Stop Loss', liq_alert_title:'Warning! Liquidation risk.',
    liq_alert_desc:'Your Stop Loss is beyond the estimated liquidation price.',
    include_fees:'Include fees (0.04% each way, estimate)', profit_tp:'Profit (TP)',
    loss_sl:'Loss (SL)', net:'Net', no_fees:'No fees',
    risk_desc:'Calculate position size based on how much you are willing to risk.',
    balance:'Account Balance (USDT)', risk_amt:'Risk ($)', margin_required:'Required Margin',
    lev_guideline:'Illustrative limit', lev_warning:'Warning: high leverage',
    no_guideline:'No leverage lies within the illustrative guideline for this stop',
    position:'Position size', insufficient:'Required margin exceeds your account balance.',
    price_warning:'Use positive prices and leverage between 1x and 125x.',
    ad_space:'ADVERTISING SPACE', fee_liq:'Possible liquidation before Stop Loss',
    calc_disclaimer:'Liquidation price is illustrative: it excludes maintenance margin, funding and exchange-specific rules. Do not rely on this as your actual liquidation price.',
    risk_disclaimer:'Illustrative calculation excludes trading fees and slippage. Leverage does not reduce your position’s monetary risk; it only changes required margin.'
  }
};
function t(key) { return translations[lang][key] || key; }
function getNumber(id) { const v = $(id).value.trim(); return v === '' ? NaN : Number(v); }
function money(n) { return Number.isFinite(n) ? n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : '--'; }
function price(n) { if (!Number.isFinite(n)) return '--'; if (n > 0 && n < 0.00000001) return n.toExponential(4); return n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:8}); }
function formatPnl(n) { return Number.isFinite(n) ? (n > 0 ? '+' : '') + money(n) : '--'; }
function setNote(id, text) { const e = $(id); e.hidden = !text; e.textContent = text || ''; }
function applyTheme(theme) {
  document.documentElement.classList.toggle('dark',theme === 'dark');
  const use = $('theme-icon').querySelector('use');
  use.setAttribute('href', './icons/ui-icons.svg#' + (theme === 'dark' ? 'sun' : 'moon'));
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#0b1121' : '#f9fafb';
}
function switchTab(tab) {
  currentTab = tab === 'risk' ? 'risk' : 'calc';
  const isCalc = currentTab === 'calc';
  $('section-calc').hidden = !isCalc;
  $('section-risk').hidden = isCalc;
  $('btn-tab-calc').classList.toggle('active',isCalc);
  $('btn-tab-risk').classList.toggle('active',!isCalc);
  $('btn-tab-calc').setAttribute('aria-selected',String(isCalc));
  $('btn-tab-risk').setAttribute('aria-selected',String(!isCalc));
  save();
}
function setDirection(dir) {
  direction = dir === 'short' ? 'short' : 'long';
  ['long','short'].forEach(d => {
    const el = $('btn-' + d);
    el.classList.toggle('active',direction === d);
    el.classList.toggle(d,direction === d);
    el.setAttribute('aria-pressed',String(direction === d));
  });
  calculateStandard();save();
}
function syncLeverage(prefix,source) {
  const input = $(prefix+'-leverage-input');
  const slider = $(prefix+'-leverage-slider');
  let value = Number(source === 'slider' ? slider.value : input.value);
  if (Number.isFinite(value) && value >= 1 && value <= 125 && Number.isInteger(value)) {
    if (source === 'slider') input.value = value;
    else slider.value = value;
  }
  if (prefix === 'c') calculateStandard(); else calculateRisk();
  save();
}
function normalizeLeverage(prefix) {
  const input = $(prefix+'-leverage-input');
  let n = Math.round(Number(input.value));
  if (!Number.isFinite(n)) n = 1;
  input.value = Math.min(125,Math.max(1,n));
  syncLeverage(prefix,'input');
}
function changeLev(prefix,step) {
  normalizeLeverage(prefix);
  $(prefix+'-leverage-input').value = Math.max(1,Math.min(125,Number($(prefix+'-leverage-input').value) + step));
  syncLeverage(prefix,'input');
}
function resetTradeOutputs() {
  $('c-liq-price').textContent = '--';
  for(const id of ['c-tp-pnl','c-tp-net','c-sl-pnl','c-sl-net']) $(id).textContent = '--';
  $('c-results').classList.add('dimmed');$('liq-alert').hidden = true;setNote('trade-warning','');
}
function calculateStandard() {
  const margin=getNumber('c-margin'), leverage=getNumber('c-leverage-input'), entry=getNumber('c-entry');
  const tp=getNumber('c-tp'),sl=getNumber('c-sl');
  const result=TradeMath.calculateTrade({direction,margin,leverage,entry,tp,sl,includeFees:$('c-fees-toggle').checked});
  if (!result) {resetTradeOutputs();if ([margin,entry].some(v=>Number.isFinite(v)&&v<0) || Number.isFinite(leverage)&&(leverage<1||leverage>125||!Number.isInteger(leverage)))setNote('trade-warning',t('price_warning'));return;}
  $('c-results').classList.remove('dimmed');
  $('c-liq-price').textContent=price(result.liquidationEstimate);
  $('liq-alert').hidden=!result.slBeyondLiq;
  setNote('trade-warning','');
  function render(prefix,value,invalidSL) {
    $(prefix+'-pnl').textContent= invalidSL ? t('fee_liq') : (value ? formatPnl(value.pnl) : '--');
    $(prefix+'-pnl').style.fontSize=invalidSL ? '13px' : '';
    $(prefix+'-net').textContent=invalidSL ? '--' : (value ? ($('c-fees-toggle').checked ? `${t('net')}: ${money(value.net)} USDT` : t('no_fees')) : '--');
    $(prefix+'-pnl').classList.toggle('green-text',!!value && value.pnl>=0 && !invalidSL);
    $(prefix+'-pnl').classList.toggle('red-text',!!value && value.pnl<0 || invalidSL);
  }
  render('c-tp',result.tp,false);
  render('c-sl',result.sl,result.slBeyondLiq);
}
function calculateRisk() {
  const balance=getNumber('r-balance'), entry=getNumber('r-entry'), sl=getNumber('r-sl');
  const riskPercent=getNumber('r-percent'), lev=getNumber('r-leverage-input');
  $('r-percent-display').textContent=Number.isFinite(riskPercent)?riskPercent.toFixed(1)+'%':'--';
  $('r-risk-amt').textContent=Number.isFinite(balance)&&balance>0&&Number.isFinite(riskPercent)?'$'+money(balance*riskPercent/100):'$0.00';
  const result=TradeMath.calculateRisk({balance,riskPercent,leverage:lev,entry,stopLoss:sl});
  if(!result){ $('r-results').classList.add('dimmed'); $('r-result-margin').textContent='--'; $('r-lev-rec').textContent='--'; $('r-position-size').textContent='--';setNote('risk-warning','');return; }
  $('r-results').classList.remove('dimmed');
  $('r-result-margin').textContent=money(result.requiredMargin)+' USDT';
  $('r-position-size').textContent=`${t('position')}: ${money(result.notional)} USDT`;
  $('r-lev-rec').textContent=result.guidelineLeverage < 1 ? `⚠ ${t('no_guideline')}` : `${result.highLeverage?'⚠ '+t('lev_warning'):t('lev_guideline')} (≤ ${result.guidelineLeverage}x)`;
  setNote('risk-warning',result.insufficientBalance ? t('insufficient'):'');
}
function applyLanguage(next) {
  lang=next === 'en' ? 'en':'es';document.documentElement.lang=lang;
  $('lang-display').textContent=lang.toUpperCase();
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent=t(e.dataset.i18n); });
  calculateStandard();calculateRisk();save();
}
const inputIds=['c-margin','c-leverage-input','c-entry','c-tp','c-sl','r-balance','r-percent','r-leverage-input','r-entry','r-sl'];
function save() {
  try { const fields={}; for(const id of inputIds)fields[id]=$(id).value;
    localStorage.setItem(SAVE_KEY,JSON.stringify({language:lang,theme:document.documentElement.classList.contains('dark')?'dark':'light',tab:currentTab,direction,fields,fees:$('c-fees-toggle').checked}));
  }catch(_){} // Modo privado o almacenamiento restringido
}
function restore() {
  try {
    const obj=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');
    if (obj.fields && typeof obj.fields==='object')for(const id of inputIds) if(typeof obj.fields[id]==='string'&&obj.fields[id].length<=40)$(id).value=obj.fields[id];
    if (typeof obj.fees==='boolean')$('c-fees-toggle').checked=obj.fees;
    if (obj.theme==='light')applyTheme('light');
    setDirection(obj.direction);switchTab(obj.tab);applyLanguage(obj.language);
  }catch(_) {applyLanguage('es');}
}
function registerSW() {
  if(!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol))return;
  navigator.serviceWorker.register('./service-worker.js',{scope:'./'}).then(reg=>{
    const update=()=>reg.update().catch(()=>{});
    window.addEventListener('focus',update);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
    let refreshing=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;location.reload();}});
  }).catch(err=>console.warn('PWA no disponible:',err));
}
function init() {
  $('btn-tab-calc').addEventListener('click',()=>switchTab('calc'));
  $('btn-tab-risk').addEventListener('click',()=>switchTab('risk'));
  $('btn-long').addEventListener('click',()=>setDirection('long'));
  $('btn-short').addEventListener('click',()=>setDirection('short'));
  $('language-toggle').addEventListener('click',()=>applyLanguage(lang==='es'?'en':'es'));
  $('theme-toggle').addEventListener('click',()=>{applyTheme(document.documentElement.classList.contains('dark')?'light':'dark');save();});
  for(const prefix of ['c','r']){
    $(prefix+'-leverage-input').addEventListener('input',()=>syncLeverage(prefix,'input'));
    $(prefix+'-leverage-input').addEventListener('blur',()=>normalizeLeverage(prefix));
    $(prefix+'-leverage-slider').addEventListener('input',()=>syncLeverage(prefix,'slider'));
  }
  document.querySelectorAll('[data-step-prefix]').forEach(b=>b.addEventListener('click',()=>changeLev(b.dataset.stepPrefix,Number(b.dataset.step))));
  for(const id of inputIds){if(id.includes('leverage'))continue;$(id).addEventListener('input',()=>{ if(id.startsWith('c-'))calculateStandard();else calculateRisk();save(); });}
  $('c-fees-toggle').addEventListener('change',()=>{calculateStandard();save();});
  restore();calculateStandard();calculateRisk();registerSW();
}
document.addEventListener('DOMContentLoaded',init);
