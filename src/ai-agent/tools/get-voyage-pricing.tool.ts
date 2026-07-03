/**
 * Tool: getVoyagePricing
 * 
 * Calcula el costo estimado de un viaje usando la fórmula:
 * finalCost = basePrice × durationDays × shipTypeMultiplier × cargoMultiplier × distanceMultiplier
 */

const SHIP_TYPE_MULTIPLIERS: Record<string, number> = {
  CONTAINER:    1.0,
  BULK_CARRIER: 1.1,
  TANKER:       1.3,
  REEFER:       1.5,
  HEAVY_LIFT:   1.8,
};

const CARGO_MULTIPLIERS: Record<string, number> = {
  GENERAL:      1.0,
  REFRIGERATED: 1.4,
  HAZARDOUS:    1.6,
  BULK:         1.1,
  OVERSIZED:    2.0,
};

export function getVoyagePricing(params: {
  basePrice: number;
  durationDays: number;
  shipType: string;
  cargoType: string;
  distanceKm: number;
}) {
  const { basePrice, durationDays, shipType, cargoType, distanceKm } = params;

  const shipMultiplier     = SHIP_TYPE_MULTIPLIERS[shipType]  ?? 1.0;
  const cargoMultiplier    = CARGO_MULTIPLIERS[cargoType]     ?? 1.0;
  const distanceMultiplier = 1 + (distanceKm / 10000);

  const finalCost = basePrice * durationDays * shipMultiplier * cargoMultiplier * distanceMultiplier;

  return {
    basePrice,
    durationDays,
    shipMultiplier,
    cargoMultiplier,
    distanceMultiplier: Math.round(distanceMultiplier * 100) / 100,
    finalCost: Math.round(finalCost * 100) / 100,
    summary: `Costo estimado: $${Math.round(finalCost).toLocaleString()} USD para ${durationDays} días con un barco tipo ${shipType} cargando ${cargoType}.`,
  };
}