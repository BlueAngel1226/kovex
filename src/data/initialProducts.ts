import { Product, SaleRecord } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'KVX-001',
    name: 'Café Molido Tradicional 500g',
    unit: 'Bolsa 500g',
    category: 'Café y Panadería',
    priceCOP: 16800,
    stock: 14,
  },
  {
    id: 'prod-2',
    sku: 'KVX-002',
    name: 'Arroz Blanco Premium 1kg',
    unit: 'Bolsa 1kg',
    category: 'Abarrotes',
    priceCOP: 4900,
    stock: 2, // Stock bajo (< 3) para demostración inmediata de alerta roja
  },
  {
    id: 'prod-3',
    sku: 'KVX-003',
    name: 'Leche Entera Deslactosada 1.1L',
    unit: 'Bolsa 1.1L',
    category: 'Lácteos y Huevos',
    priceCOP: 5400,
    stock: 9,
  },
  {
    id: 'prod-4',
    sku: 'KVX-004',
    name: 'Cubeta de Huevos AA x30 und',
    unit: 'Cubeta x30',
    category: 'Lácteos y Huevos',
    priceCOP: 18500,
    stock: 2, // Stock bajo (< 3) para demostración inmediata
  },
  {
    id: 'prod-5',
    sku: 'KVX-005',
    name: 'Aceite Vegetal Girasol 1L',
    unit: 'Botella 1L',
    category: 'Abarrotes',
    priceCOP: 11200,
    stock: 7,
  },
  {
    id: 'prod-6',
    sku: 'KVX-006',
    name: 'Panela Pulverizada Orgánica 1kg',
    unit: 'Paquete 1kg',
    category: 'Abarrotes',
    priceCOP: 6500,
    stock: 11,
  },
  {
    id: 'prod-7',
    sku: 'KVX-007',
    name: 'Arepas de Maíz Blanco x10 und',
    unit: 'Paquete x10',
    category: 'Café y Panadería',
    priceCOP: 4200,
    stock: 5,
  },
  {
    id: 'prod-8',
    sku: 'KVX-008',
    name: 'Queso Campesino Fresco 500g',
    unit: 'Bloque 500g',
    category: 'Lácteos y Huevos',
    priceCOP: 12900,
    stock: 1, // Stock crítico (< 3)
  },
  {
    id: 'prod-9',
    sku: 'KVX-009',
    name: 'Gaseosa Colombiana 1.5L',
    unit: 'Botella 1.5L',
    category: 'Bebidas',
    priceCOP: 5800,
    stock: 16,
  },
  {
    id: 'prod-10',
    sku: 'KVX-010',
    name: 'Chocolate de Mesa con Canela 500g',
    unit: 'Pastilla 500g',
    category: 'Café y Panadería',
    priceCOP: 9600,
    stock: 8,
  },
  {
    id: 'prod-11',
    sku: 'KVX-011',
    name: 'Detergente Líquido Multiusos 2L',
    unit: 'Envase 2L',
    category: 'Aseo y Hogar',
    priceCOP: 15400,
    stock: 4,
  },
  {
    id: 'prod-12',
    sku: 'KVX-012',
    name: 'Papas Criollas Crocantes 150g',
    unit: 'Paquete 150g',
    category: 'Snacks y Dulces',
    priceCOP: 4500,
    stock: 12,
  },
];

export const INITIAL_SALES: SaleRecord[] = [
  {
    id: 'sale-101',
    folio: 'VTA-001',
    timestamp: 'Hoy · 08:42 a. m.',
    items: [
      {
        productId: 'prod-1',
        name: 'Café Molido Tradicional 500g',
        quantity: 1,
        unitPriceCOP: 16800,
        subtotalCOP: 16800,
      },
      {
        productId: 'prod-7',
        name: 'Arepas de Maíz Blanco x10 und',
        quantity: 2,
        unitPriceCOP: 4200,
        subtotalCOP: 8400,
      },
    ],
    totalCOP: 25200,
    paymentMethod: 'Nequi',
    customerName: 'Doña Martha Gómez',
    customerPhone: '3104528890',
    deliveryType: 'Domicilio',
    deliveryAddress: 'Cra 15 #42-18 Apto 301',
  },
  {
    id: 'sale-102',
    folio: 'VTA-002',
    timestamp: 'Hoy · 09:15 a. m.',
    items: [
      {
        productId: 'prod-3',
        name: 'Leche Entera Deslactosada 1.1L',
        quantity: 2,
        unitPriceCOP: 5400,
        subtotalCOP: 10800,
      },
      {
        productId: 'prod-9',
        name: 'Gaseosa Colombiana 1.5L',
        quantity: 1,
        unitPriceCOP: 5800,
        subtotalCOP: 5800,
      },
    ],
    totalCOP: 16600,
    paymentMethod: 'Efectivo',
    customerName: 'Carlos Andrés Ruiz',
    deliveryType: 'Mostrador',
  },
];

export const formatCOP = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
};
