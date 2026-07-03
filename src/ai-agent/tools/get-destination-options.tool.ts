/**
 * Tool: getDestinationOptions
 * 
 * Retorna las rutas y destinos disponibles.
 * Por ahora es estático — más adelante puede venir de la DB.
 */
export function getDestinationOptions() {
  const routes = [
    { from: 'Asunción, PY',    to: 'Buenos Aires, AR', distanceKm: 1500,  durationDays: 5  },
    { from: 'Asunción, PY',    to: 'Santos, BR',       distanceKm: 1800,  durationDays: 6  },
    { from: 'Buenos Aires, AR', to: 'Rotterdam, NL',   distanceKm: 11000, durationDays: 22 },
    { from: 'Santos, BR',      to: 'Hamburg, DE',      distanceKm: 9500,  durationDays: 18 },
    { from: 'Buenos Aires, AR', to: 'Shanghai, CN',    distanceKm: 19000, durationDays: 35 },
    { from: 'Santos, BR',      to: 'Miami, US',        distanceKm: 7500,  durationDays: 14 },
  ];

  return routes
    .map(
      (r) =>
        `- ${r.from} → ${r.to}: ~${r.distanceKm}km, ~${r.durationDays} días`,
    )
    .join('\n');
}