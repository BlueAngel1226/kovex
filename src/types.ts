export type ProductCategory =
  | 'Abarrotes'
  | 'Bebidas'
  | 'Lácteos y Huevos'
  | 'Café y Panadería'
  | 'Snacks y Dulces'
  | 'Aseo y Hogar';

export interface Product {
  id: string;
  sku: string;
  name: string;
  unit: string;
  category: ProductCategory;
  priceCOP: number;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'Efectivo' | 'Nequi' | 'Daviplata' | 'Transferencia';

export interface SaleRecord {
  id: string;
  folio: string;
  timestamp: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPriceCOP: number;
    subtotalCOP: number;
  }[];
  totalCOP: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  deliveryType: 'Mostrador' | 'Domicilio';
  deliveryAddress?: string;
}
