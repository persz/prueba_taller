/**
 * @file vehiculos.service.js
 * @description Lógica de negocio para consulta de vehículos.
 * Los datos se obtienen en tiempo real desde la API NHTSA usando el VIN.
 * No se almacenan vehículos en la BD — se congelan en la OT al momento de crearla.
 */

/**
 * Consulta la API NHTSA para decodificar un VIN y retorna los datos del vehículo.
 * @param {string} vin - Vehicle Identification Number (17 caracteres)
 * @returns {object} Datos del vehículo { vin, marca, modelo, anio, tipo }
 * @throws {Error} Si el VIN es inválido o la API no responde
 */
const decodificarVIN = async (vin) => {
  // Validar formato básico del VIN
  if (!vin || vin.trim().length !== 17) {
    const error = new Error('El VIN debe tener exactamente 17 caracteres.');
    error.status = 400;
    throw error;
  }

  const vinLimpio = vin.trim().toUpperCase();

  try {
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vinLimpio}?format=json`
    );

    if (!response.ok) {
      const error = new Error('No se pudo conectar con la API de verificación de VIN. Intenta nuevamente.');
      error.status = 503;
      throw error;
    }

    const data = await response.json();

    // Extraer los campos relevantes del resultado
    const resultados = data.Results;

    const obtenerValor = (variable) => {
      const item = resultados.find((r) => r.Variable === variable);
      return item && item.Value && item.Value !== 'null' && item.Value !== '0'
        ? item.Value
        : null;
    };

    const marca  = obtenerValor('Make');
    const modelo = obtenerValor('Model');
    const anio   = obtenerValor('Model Year');
    const tipo   = obtenerValor('Vehicle Type');

    // Validar que el VIN retornó datos útiles
    if (!marca && !modelo) {
      const error = new Error(`El VIN "${vinLimpio}" no retornó datos válidos. Verifica que sea correcto.`);
      error.status = 404;
      throw error;
    }

    return {
      vin:    vinLimpio,
      marca:  marca  || 'No disponible',
      modelo: modelo || 'No disponible',
      anio:   anio   || 'No disponible',
      tipo:   tipo   || 'No disponible',
    };
  } catch (error) {
    // Si el error ya tiene status definido, relanzarlo
    if (error.status) throw error;

    // Error de red o inesperado
    const err = new Error('Error al conectar con la API NHTSA. Verifica tu conexión a internet.');
    err.status = 503;
    throw err;
  }
};

module.exports = { decodificarVIN };