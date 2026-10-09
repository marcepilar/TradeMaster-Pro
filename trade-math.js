/* TradeMaster Pro · v1.0.0 · Funciones de cálculo puras y verificables.
 * Las cifras son estimativas; las reglas reales del exchange pueden diferir.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TradeMath = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FEE_RATE = 0.0004; // 0,04 % por lado (solo si se activa)
  const isPositive = (n) => Number.isFinite(n) && n > 0;
  const validLev = (n) => Number.isInteger(n) && n >= 1 && n <= 125;

  function calculateTrade({ direction, margin, leverage, entry, tp, sl, includeFees }) {
    if (!['long', 'short'].includes(direction) || !isPositive(margin) || !isPositive(entry) || !validLev(leverage)) return null;
    const notional = margin * leverage;
    const quantity = notional / entry;
    if (!Number.isFinite(notional) || !Number.isFinite(quantity)) return null;
    const liquidationEstimate = Math.max(0, direction === 'long' ? entry * (1 - 1 / leverage) : entry * (1 + 1 / leverage));
    function exitOutcome(exitPrice) {
      if (!isPositive(exitPrice)) return null;
      const pnl = (direction === 'long' ? 1 : -1) * (exitPrice - entry) * quantity;
      const fees = includeFees ? (notional + exitPrice * quantity) * FEE_RATE : 0;
      if (!Number.isFinite(pnl) || !Number.isFinite(fees)) return null;
      return { pnl, fees, net: pnl - fees };
    }
    const slBeyondLiq = isPositive(sl) && (direction === 'long' ? sl <= liquidationEstimate : sl >= liquidationEstimate);
    return { notional, quantity, liquidationEstimate, slBeyondLiq, tp: exitOutcome(tp), sl: exitOutcome(sl) };
  }

  function calculateRisk({ balance, riskPercent, leverage, entry, stopLoss }) {
    if (![balance, entry, stopLoss, riskPercent].every(isPositive) || !validLev(leverage) || riskPercent > 100 || entry === stopLoss) return null;
    const distance = Math.abs(entry - stopLoss) / entry;
    const riskAmount = balance * riskPercent / 100;
    const notional = riskAmount / distance;
    const requiredMargin = notional / leverage;
    const theoreticalMaxLeverage = 1 / distance; // Sin margen de mantenimiento ni gastos
    const guidelineLeverage = Math.min(125, Math.floor(0.9 * theoreticalMaxLeverage));
    if (![riskAmount, notional, requiredMargin, theoreticalMaxLeverage].every(Number.isFinite)) return null;
    return { distance, riskAmount, notional, requiredMargin, theoreticalMaxLeverage, guidelineLeverage,
      highLeverage: guidelineLeverage < 1 || leverage > guidelineLeverage,
      insufficientBalance: requiredMargin > balance };
  }
  return { FEE_RATE, calculateTrade, calculateRisk };
});
