/**
 * Fundamental Physical Constants (2022 CODATA)
 * Sourced from the studied college and MIT 8.07 reference sheets.
 */
export const CODATA = {
  g: 9.80665, // Standard acceleration due to gravity (m/s^2)
  G: 6.6743e-11, // Universal gravitational constant (m^3 / (kg s^2))
  c: 299792458, // Speed of light in vacuum (m/s)
  e: 1.602176634e-19, // Elementary charge (C)
  eps0: 8.8541878188e-12, // Vacuum electric permittivity (C^2 / (N m^2))
  mu0: 4 * Math.PI * 1e-7, // Vacuum magnetic permeability (N / A^2)
  k_e: 8.9875517923e9, // Coulomb constant 1/(4*pi*eps0) (N m^2 / C^2)
  h: 6.62607015e-34, // Planck constant (J s)
  k_B: 1.380649e-23, // Boltzmann constant (J / K)
  N_A: 6.02214076e23, // Avogadro constant (1 / mol)
  R: 8.314462618, // Ideal gas constant (J / (mol K))
  sigma_SB: 5.670374419e-8, // Stefan-Boltzmann constant (W / (m^2 K^4))
  m_e: 9.1093837139e-31, // Electron mass (kg)
  m_p: 1.67262192595e-27, // Proton mass (kg)
  rho_air: 1.225, // Sea-level air density (kg/m^3)
  rho_water: 1000, // Density of water (kg/m^3)
  v_sound_air: 343, // Speed of sound in air at 20 C (m/s)
} as const;

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function roundTo(val: number, decimals = 6): number {
  if (!Number.isFinite(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
