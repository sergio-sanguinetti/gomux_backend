const axios = require('axios');
const { URLSearchParams } = require('url');
const prisma = require('../config/prisma');
const logger = require('../utils/logger');

const SKYDROPX_BASE_URL = process.env.SKYDROPX_BASE_URL || 'https://pro.skydropx.com';

// Dirección de origen (tu tienda) - configurable por .env
const getAddressFrom = () => ({
  country_code: 'mx',
  postal_code: process.env.SKYDROPX_ORIGIN_POSTAL_CODE || '39000',
  area_level1: process.env.SKYDROPX_ORIGIN_STATE || 'Guerrero',
  area_level2: process.env.SKYDROPX_ORIGIN_MUNICIPALITY || 'Chilpancingo',
  area_level3: process.env.SKYDROPX_ORIGIN_NEIGHBORHOOD || 'Centro',
  street1: process.env.SKYDROPX_ORIGIN_STREET || 'Av. Juan N. Alvarez Sur #9',
  name: process.env.SKYDROPX_ORIGIN_NAME || 'Tienda',
  company: process.env.SKYDROPX_ORIGIN_COMPANY || 'Gomux',
  phone: process.env.SKYDROPX_ORIGIN_PHONE || '',
  email: process.env.SKYDROPX_ORIGIN_EMAIL || ''
});

/**
 * Obtener peso y volumen de los ítems.
 * Si el producto existe en BD y tiene datos de envío (futuro), los usa; si no, valores por defecto.
 */
async function calcularPaquete(items) {
  let totalWeight = 0;
  let totalVolume = 0;
  const defaultWeightPerUnit = 0.2;
  const defaultVolumePerUnit = 1000; // cm³

  for (const item of items) {
    const productId = typeof item.id === 'string' ? parseInt(item.id, 10) : item.id;
    const cantidad = item.cantidad || item.quantity || 1;
    if (!productId || isNaN(productId)) {
      totalWeight += defaultWeightPerUnit * cantidad;
      totalVolume += defaultVolumePerUnit * cantidad;
      continue;
    }
    try {
      const product = await prisma.producto.findUnique({
        where: { id: productId }
      });
      if (product) {
        // Si en el futuro agregas peso, largo, ancho, alto a Producto, descomenta:
        // const peso = (product.peso ?? defaultWeightPerUnit) * cantidad;
        // const vol = (product.largo ?? 10) * (product.ancho ?? 10) * (product.alto ?? 10) * cantidad;
        totalWeight += defaultWeightPerUnit * cantidad;
        totalVolume += defaultVolumePerUnit * cantidad;
      } else {
        totalWeight += defaultWeightPerUnit * cantidad;
        totalVolume += defaultVolumePerUnit * cantidad;
      }
    } catch (e) {
      logger.warn('Error al buscar producto para envío:', e.message);
      totalWeight += defaultWeightPerUnit * cantidad;
      totalVolume += defaultVolumePerUnit * cantidad;
    }
  }

  if (totalWeight <= 0) totalWeight = 1;
  if (totalVolume <= 0) totalVolume = 1000;

  const equivalentSide = Math.ceil(Math.cbrt(totalVolume));
  const parcel = {
    length: Math.max(1, equivalentSide),
    width: Math.max(1, equivalentSide),
    height: Math.max(1, equivalentSide),
    weight: Math.max(0.1, totalWeight)
  };
  return { totalWeight, totalVolume, equivalentSide, parcel };
}

/**
 * POST /api/envio/cotizar
 * Body: { items: [{ id, cantidad }], address_to: { zipCode, state, municipality, neighborhood?, streetAddress?, externalNumber?, contactName, contactPhone } }
 */
const cotizarEnvio = async (req, res) => {
  try {
    const { items, address_to } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Faltan los items del carrito.'
      });
    }
    if (!address_to || !address_to.zipCode || !address_to.state) {
      return res.status(400).json({
        success: false,
        message: 'Falta la dirección de destino (código postal y estado).'
      });
    }

    const API_KEY = process.env.SKYDROPX_API_KEY;
    const API_SECRET = process.env.SKYDROPX_API_SECRET;
    if (!API_KEY || !API_SECRET) {
      logger.warn('Skydropx: faltan SKYDROPX_API_KEY o SKYDROPX_API_SECRET');
      return res.status(503).json({
        success: false,
        message: 'Servicio de envío no configurado. Contacta al administrador.'
      });
    }

    const { parcel, totalWeight, totalVolume, equivalentSide } = await calcularPaquete(items);
    const address_from = getAddressFrom();
    const mapped_address_to = {
      country_code: 'mx',
      postal_code: String(address_to.zipCode).trim(),
      area_level1: String(address_to.state).trim(),
      area_level2: (address_to.municipality || address_to.ciudad || '').trim() || 'No especificado',
      area_level3: (address_to.neighborhood || '').trim() || 'Centro',
      street1: [address_to.streetAddress, address_to.externalNumber].filter(Boolean).join(' ').trim() || 'Calle por definir',
      name: (address_to.contactName || '').trim() || 'Cliente',
      company: 'Cliente',
      phone: (address_to.contactPhone || '').trim() || '0000000000',
      email: (address_to.contactEmail || '').trim() || 'cliente@example.com'
    };

    let bearerToken;
    try {
      const tokenParams = new URLSearchParams();
      tokenParams.append('grant_type', 'client_credentials');
      tokenParams.append('client_id', API_KEY);
      tokenParams.append('client_secret', API_SECRET);
      const tokenResponse = await axios.post(`${SKYDROPX_BASE_URL}/api/v1/oauth/token`, tokenParams, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      bearerToken = tokenResponse.data.access_token;
    } catch (err) {
      logger.error('Skydropx auth error:', err.response?.data || err.message);
      return res.status(502).json({
        success: false,
        message: 'No se pudo conectar con el servicio de envío.'
      });
    }

    const quotationPayload = {
      quotation: {
        address_from,
        address_to: mapped_address_to,
        parcel,
        requested_carriers: (process.env.SKYDROPX_CARRIERS || 'fedex,dhl').split(',').map(c => c.trim()).filter(Boolean)
      }
    };

    let quotationId;
    try {
      const createRes = await axios.post(`${SKYDROPX_BASE_URL}/api/v1/quotations`, quotationPayload, {
        headers: { Authorization: `Bearer ${bearerToken}`, 'Content-Type': 'application/json' }
      });
      quotationId = createRes.data.id;
    } catch (err) {
      logger.error('Skydropx create quotation error:', err.response?.data || err.message);
      return res.status(502).json({
        success: false,
        message: 'No se pudo crear la cotización de envío.'
      });
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      const getRes = await axios.get(`${SKYDROPX_BASE_URL}/api/v1/quotations/${quotationId}`, {
        headers: { Authorization: `Bearer ${bearerToken}` }
      });
      const rawRates = getRes.data?.rates || getRes.data?.data || [];
      // Normalizar cada rate para que el frontend siempre tenga carrier, service, price y deliveryDays
      const rates = rawRates.map((r, idx) => {
        const att = r.attributes || r;
        const price = att.total_price ?? att.price ?? r.total_price ?? r.price ?? att.amount ?? r.amount ?? 0;
        const carrier = att.carrier ?? att.carrier_name ?? r.carrier ?? r.carrier_name ?? '';
        const service = att.service ?? att.service_name ?? r.service ?? r.service_name ?? att.name ?? '';
        const deliveryDays = att.delivery_days ?? att.delivery_days_estimated ?? r.delivery_days ?? r.delivery_days_estimated ?? att.estimated_days ?? '';
        return {
          id: r.id ?? att.id ?? `rate-${idx}`,
          carrier: String(carrier).trim(),
          service: String(service).trim(),
          price: typeof price === 'number' ? price : parseFloat(price) || 0,
          deliveryDays: deliveryDays != null ? String(deliveryDays).trim() : '',
          _raw: r
        };
      });
      return res.json({
        success: true,
        rates,
        paqueteCalculado: {
          volumenTotalCm3: totalVolume.toFixed(2),
          pesoTotalKg: totalWeight.toFixed(2),
          ladoCajaCm: equivalentSide
        }
      });
    } catch (err) {
      logger.error('Skydropx get quotation error:', err.response?.data || err.message);
      return res.status(502).json({
        success: false,
        message: 'No se pudieron obtener las tarifas de envío.'
      });
    }
  } catch (error) {
    logger.error('Error en cotizarEnvio:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cotizar el envío.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  cotizarEnvio
};
