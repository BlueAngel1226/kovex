import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  AlertTriangle,
  ShoppingCart,
  CheckCircle2,
  MessageCircle,
  Copy,
  Check,
  Trash2,
  RotateCcw,
  PackagePlus,
  ArrowUpRight,
  Receipt,
  Package,
  X,
} from 'lucide-react';
import {
  Product,
  ProductCategory,
  CartItem,
  PaymentMethod,
  SaleRecord,
} from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  formatCOP,
} from './data/initialProducts';

type ActiveView = 'all' | 'inventory' | 'pos' | 'history';

const CATEGORIES: ProductCategory[] = [
  'Abarrotes',
  'Lácteos y Huevos',
  'Café y Panadería',
  'Bebidas',
  'Snacks y Dulces',
  'Aseo y Hogar',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Efectivo',
  'Nequi',
  'Daviplata',
  'Transferencia',
];

const STORAGE_KEYS = {
  PRODUCTS: 'kovex_mvp_products_v1',
  SALES: 'kovex_mvp_sales_v1',
};

export default function App() {
  // In-memory state initialized with local persistence for seamless demo reloads
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_PRODUCTS;
  });

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SALES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_SALES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {
      // ignore
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch {
      // ignore
    }
  }, [sales]);

  // Navigation view state
  const [activeView, setActiveView] = useState<ActiveView>('all');

  // Inventory filter states
  const [inventorySearch, setInventorySearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Quick Sale (POS) states
  const [posSearch, setPosSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([
    {
      product: INITIAL_PRODUCTS[0],
      quantity: 1,
    },
    {
      product: INITIAL_PRODUCTS[6],
      quantity: 2,
    },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [cashTendered, setCashTendered] = useState<string>('');

  // WhatsApp & Customer Order states
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryType, setDeliveryType] = useState<'Mostrador' | 'Domicilio'>('Domicilio');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);

  // Feedback banner & New Product Modal
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'warning';
    message: string;
    whatsappUrl?: string;
  } | null>(null);

  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdUnit, setNewProdUnit] = useState('Unidad');
  const [newProdCategory, setNewProdCategory] = useState<ProductCategory>('Abarrotes');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('10');

  // Keep cart product references synced with latest stock/price
  const syncedCart = useMemo(() => {
    return cart
      .map((item) => {
        const latestProduct = products.find((p) => p.id === item.product.id);
        if (!latestProduct) return null;
        return {
          product: latestProduct,
          quantity: item.quantity,
        };
      })
      .filter((item): item is CartItem => item !== null);
  }, [cart, products]);

  // Computed metrics
  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock < 3).length,
    [products]
  );

  const totalUnitsInStock = useMemo(
    () => products.reduce((acc, p) => acc + p.stock, 0),
    [products]
  );

  const totalInventoryValueCOP = useMemo(
    () => products.reduce((acc, p) => acc + p.priceCOP * p.stock, 0),
    [products]
  );

  const todaySalesTotalCOP = useMemo(
    () => sales.reduce((acc, s) => acc + s.totalCOP, 0),
    [sales]
  );

  // Filtered Inventory Products
  const filteredInventory = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        product.sku.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        product.category.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Todas' || product.category === selectedCategory;
      const matchesLowStock = !onlyLowStock || product.stock < 3;
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [products, inventorySearch, selectedCategory, onlyLowStock]);

  // Filtered POS Quick-Finder Products
  const posQuickProducts = useMemo(() => {
    const query = posSearch.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [products, posSearch]);

  // Cart Calculations
  const cartTotalCOP = useMemo(() => {
    return syncedCart.reduce(
      (sum, item) => sum + item.product.priceCOP * item.quantity,
      0
    );
  }, [syncedCart]);

  const cartTotalItems = useMemo(() => {
    return syncedCart.reduce((sum, item) => sum + item.quantity, 0);
  }, [syncedCart]);

  const parsedCashTendered = Number(cashTendered.replace(/\D/g, '')) || 0;
  const cashChangeCOP =
    paymentMethod === 'Efectivo' && parsedCashTendered > cartTotalCOP
      ? parsedCashTendered - cartTotalCOP
      : 0;

  // Adjust stock (+1 / -1 or custom delta)
  const handleAdjustStock = (productId: string, delta: number) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id !== productId) return prod;
        const nextStock = Math.max(0, prod.stock + delta);
        return { ...prod, stock: nextStock };
      })
    );
  };

  // One-click Add to Cart from POS search or Inventory table
  const handleAddToCart = (product: Product) => {
    setFeedbackBanner(null);
    const existingItem = syncedCart.find((i) => i.product.id === product.id);
    const currentQtyInCart = existingItem ? existingItem.quantity : 0;

    if (product.stock <= 0) {
      setFeedbackBanner({
        type: 'warning',
        message: `"${product.name}" está agotado (0 en stock). Usa el botón +1 en inventario para ingresar unidades.`,
      });
      return;
    }

    if (currentQtyInCart + 1 > product.stock) {
      setFeedbackBanner({
        type: 'warning',
        message: `Solo hay ${product.stock} und. disponibles de "${product.name}" en inventario.`,
      });
      return;
    }

    setCart((prev) => {
      const exists = prev.find((i) => i.product.id === product.id);
      if (exists) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setFeedbackBanner(null);
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) return;

    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          if (nextQty > targetProduct.stock) {
            setFeedbackBanner({
              type: 'warning',
              message: `Stock máximo alcanzado para "${targetProduct.name}" (${targetProduct.stock} und).`,
            });
            return item;
          }
          return { ...item, quantity: nextQty };
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setCashTendered('');
    setFeedbackBanner(null);
  };

  // Build formatted WhatsApp Order text
  const buildWhatsAppMessage = (customItems?: CartItem[], customTotal?: number, folio?: string) => {
    const itemsToUse = customItems ?? syncedCart;
    const totalToUse = customTotal ?? cartTotalCOP;

    const headerLine = folio
      ? `*Kovex — Comprobante de Pedido ${folio}*`
      : `*Kovex — Resumen de Pedido*`;

    const customerLine = customerName.trim()
      ? `Cliente: ${customerName.trim()}`
      : `Cliente: Mostrador / Pedido Rápido`;

    const deliveryLine =
      deliveryType === 'Domicilio'
        ? `Entrega: Domicilio${deliveryAddress.trim() ? ` (${deliveryAddress.trim()})` : ''}`
        : `Entrega: Recoge en tienda`;

    const itemsLines =
      itemsToUse.length > 0
        ? itemsToUse
            .map(
              (item) =>
                `- ${item.quantity}x ${item.product.name} (${formatCOP(
                  item.product.priceCOP * item.quantity
                )})`
            )
            .join('\n')
        : '- (Sin productos seleccionados)';

    const paymentLine = `Medio de pago: ${paymentMethod}`;
    const totalLine = `*TOTAL A PAGAR: ${formatCOP(totalToUse)} COP*`;

    return [
      headerLine,
      customerLine,
      deliveryLine,
      '',
      '*Detalle de productos:*',
      itemsLines,
      '',
      paymentLine,
      totalLine,
      '',
      'Gracias por comprar en nuestro comercio local.',
    ].join('\n');
  };

  const whatsappPreviewText = useMemo(
    () => buildWhatsAppMessage(),
    [syncedCart, cartTotalCOP, customerName, deliveryType, deliveryAddress, paymentMethod]
  );

  // Direct WhatsApp URL following https://wa.me/?text=... specification
  const whatsappDirectHref = useMemo(() => {
    const encoded = encodeURIComponent(whatsappPreviewText);
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      const normalizedPhone = cleanPhone.startsWith('57')
        ? cleanPhone
        : `57${cleanPhone}`;
      return `https://wa.me/${normalizedPhone}?text=${encoded}`;
    }
    return `https://wa.me/?text=${encoded}`;
  }, [whatsappPreviewText, customerPhone]);

  // Confirm Sale & automatically subtract stock
  const handleConfirmSale = () => {
    if (syncedCart.length === 0) {
      setFeedbackBanner({
        type: 'warning',
        message: 'Agrega al menos un producto al carrito antes de confirmar la venta.',
      });
      return;
    }

    // Check stock availability
    for (const item of syncedCart) {
      if (item.quantity > item.product.stock) {
        setFeedbackBanner({
          type: 'warning',
          message: `Stock insuficiente para "${item.product.name}". Disponible: ${item.product.stock} und.`,
        });
        return;
      }
    }

    const nextFolioNumber = sales.length + 1;
    const folio = `VTA-00${nextFolioNumber}`;
    const nowFormatted = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Generate WhatsApp link for this confirmed order before clearing cart
    const saleWhatsappText = buildWhatsAppMessage(syncedCart, cartTotalCOP, folio);
    const saleWhatsappUrl = `https://wa.me/?text=${encodeURIComponent(saleWhatsappText)}`;

    // Subtract stock in memory
    setProducts((prev) =>
      prev.map((prod) => {
        const soldItem = syncedCart.find((i) => i.product.id === prod.id);
        if (!soldItem) return prod;
        return {
          ...prod,
          stock: Math.max(0, prod.stock - soldItem.quantity),
        };
      })
    );

    // Record sale
    const newSale: SaleRecord = {
      id: `sale-${Date.now()}`,
      folio,
      timestamp: `Hoy · ${nowFormatted}`,
      items: syncedCart.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        quantity: i.quantity,
        unitPriceCOP: i.product.priceCOP,
        subtotalCOP: i.product.priceCOP * i.quantity,
      })),
      totalCOP: cartTotalCOP,
      paymentMethod,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      deliveryType,
      deliveryAddress: deliveryAddress.trim() || undefined,
    };

    setSales((prev) => [newSale, ...prev]);
    setCart([]);
    setCashTendered('');

    setFeedbackBanner({
      type: 'success',
      message: `Venta ${folio} confirmada por ${formatCOP(
        newSale.totalCOP
      )}. El stock se descontó automáticamente del inventario.`,
      whatsappUrl: saleWhatsappUrl,
    });
  };

  const handleCopyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(whatsappPreviewText);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2000);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const handleResetDemo = () => {
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setCart([
      { product: INITIAL_PRODUCTS[0], quantity: 1 },
      { product: INITIAL_PRODUCTS[6], quantity: 2 },
    ]);
    setCustomerName('');
    setCustomerPhone('');
    setDeliveryAddress('');
    setFeedbackBanner({
      type: 'success',
      message: 'Datos de demostración restaurados a su estado original en memoria local.',
    });
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newProdName.trim();
    const parsedPrice = Number(newProdPrice.replace(/\D/g, ''));
    const parsedStock = Math.max(0, parseInt(newProdStock, 10) || 0);

    if (!cleanName || !parsedPrice) return;

    const nextNum = products.length + 1;
    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku: `KVX-0${nextNum < 10 ? `0${nextNum}` : nextNum}`,
      name: cleanName,
      unit: newProdUnit.trim() || 'Unidad',
      category: newProdCategory,
      priceCOP: parsedPrice,
      stock: parsedStock,
    };

    setProducts((prev) => [newProduct, ...prev]);
    setNewProdName('');
    setNewProdUnit('Unidad');
    setNewProdPrice('');
    setNewProdStock('10');
    setIsNewProductOpen(false);
    setFeedbackBanner({
      type: 'success',
      message: `Producto "${newProduct.name}" agregado al inventario con ${newProduct.stock} unidades.`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Bar Contract: 1 row, 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 h-16">
          {/* Zone 1: Brand Title, one line */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('all');
            }}
            className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Kovex
          </a>

          {/* Zone 2: 4 single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setActiveView('all')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'all'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Panel Integral
            </button>
            <button
              type="button"
              onClick={() => setActiveView('inventory')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'inventory'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Inventario ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveView('pos')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'pos'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Venta Rápida y WhatsApp
            </button>
            <button
              type="button"
              onClick={() => setActiveView('history')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'history'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              Historial ({sales.length})
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsNewProductOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container (1440px max-width) */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Workspace Header & Mobile Segmented Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Sistema POS y Control de Stock en Memoria Local · Moneda COP ($)
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Operación Diaria de Tienda
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Mobile / Tablet View Selector */}
            <div className="flex md:hidden items-center bg-slate-200/80 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveView('all')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeView === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todo
              </button>
              <button
                type="button"
                onClick={() => setActiveView('inventory')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeView === 'inventory'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inventario
              </button>
              <button
                type="button"
                onClick={() => setActiveView('pos')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeView === 'pos'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Caja ({cartTotalItems})
              </button>
              <button
                type="button"
                onClick={() => setActiveView('history')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  activeView === 'history'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ventas
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetDemo}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Restaurar los productos y el stock inicial de demostración"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restaurar Demo</span>
            </button>
          </div>
        </div>

        {/* KPI Strip (Full-Width 4-Column Row) */}
        <section
          aria-label="Resumen de indicadores"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-200"
        >
          <div className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">
              Referencias Activas
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {products.length}
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {totalUnitsInStock} und. totales
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">
              Alertas de Stock (&lt; 3 und)
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl font-bold font-mono tabular-nums ${
                    lowStockCount > 0 ? 'text-red-600' : 'text-slate-900'
                  }`}
                >
                  {lowStockCount}
                </span>
                {lowStockCount > 0 && (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setOnlyLowStock((prev) => !prev);
                  if (activeView === 'pos' || activeView === 'history') {
                    setActiveView('all');
                  }
                }}
                className="text-xs font-semibold text-red-600 hover:text-red-800 underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {onlyLowStock ? 'Ver todos' : 'Filtrar críticos'}
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">
              Valor de Inventario
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {formatCOP(totalInventoryValueCOP)}
              </span>
              <span className="text-xs text-slate-500">COP</span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <span className="text-xs font-medium text-slate-500">
              Ventas Registradas Hoy
            </span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
                {formatCOP(todaySalesTotalCOP)}
              </span>
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {sales.length} {sales.length === 1 ? 'venta' : 'ventas'}
              </span>
            </div>
          </div>
        </section>

        {/* Live Action Feedback Banner */}
        {feedbackBanner && (
          <div
            role="status"
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                : 'bg-red-50/90 border-red-200 text-red-950'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3">
              {feedbackBanner.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
              )}
              <p className="text-sm font-medium">{feedbackBanner.message}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {feedbackBanner.whatsappUrl && (
                <a
                  href={feedbackBanner.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Recibo por WhatsApp</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={() => setFeedbackBanner(null)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Split Grid */}
        <div
          className={`grid grid-cols-1 gap-6 items-start ${
            activeView === 'all' ? 'xl:grid-cols-12' : 'grid-cols-1'
          }`}
        >
          {/* MODULE 1: DASHBOARD / INVENTARIO */}
          {(activeView === 'all' || activeView === 'inventory') && (
            <section
              aria-labelledby="inventory-heading"
              className={`${
                activeView === 'all' ? 'xl:col-span-7' : 'w-full'
              } bg-white border border-slate-200 rounded-xl overflow-hidden`}
            >
              {/* Inventory Header & Controls */}
              <div className="p-4 sm:p-6 border-b border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2
                      id="inventory-heading"
                      className="text-lg font-bold text-slate-900"
                    >
                      1. Inventario y Control Rápido de Stock
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ajusta existencias con +1 / -1 en tiempo real. Alerta roja automática cuando el stock es menor a 3 unidades.
                    </p>
                  </div>

                  {/* Low stock filter toggle button */}
                  <button
                    type="button"
                    onClick={() => setOnlyLowStock((prev) => !prev)}
                    className={`inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      onlyLowStock
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-3.5 h-3.5 ${
                        onlyLowStock ? 'text-white' : 'text-red-600'
                      }`}
                    />
                    <span>
                      Stock Crítico &lt; 3 ({lowStockCount})
                    </span>
                  </button>
                </div>

                {/* Search & Category Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      placeholder="Buscar por producto, código SKU o categoría..."
                      className="w-full pl-10 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900 transition-colors"
                    />
                    {inventorySearch && (
                      <button
                        type="button"
                        onClick={() => setInventorySearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        aria-label="Limpiar búsqueda"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    aria-label="Filtrar por categoría"
                    className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-slate-900"
                  >
                    <option value="Todas">Todas las categorías</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Inventory Table (Desktop & Tablet) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                      <th className="py-3 pl-6 pr-3">Producto / Categoría</th>
                      <th className="py-3 px-3 text-right">Precio (COP)</th>
                      <th className="py-3 px-3 text-center">Estado / Stock</th>
                      <th className="py-3 px-3 text-center">Ajuste Rápido</th>
                      <th className="py-3 pl-3 pr-6 text-right">Venta Rápida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-12 px-6 text-center text-slate-500"
                        >
                          <p className="text-sm font-medium text-slate-700">
                            No se encontraron productos con los filtros actuales.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setInventorySearch('');
                              setSelectedCategory('Todas');
                              setOnlyLowStock(false);
                            }}
                            className="mt-3 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Mostrar todo el inventario
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((product) => {
                        const isLowStock = product.stock < 3;
                        const isOutOfStock = product.stock === 0;
                        const inCartItem = syncedCart.find(
                          (c) => c.product.id === product.id
                        );

                        return (
                          <tr
                            key={product.id}
                            className={`transition-colors ${
                              isLowStock
                                ? 'bg-red-50/70 hover:bg-red-50'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            {/* Product & clean unboxed metadata */}
                            <td className="py-3.5 pl-6 pr-3 align-middle">
                              <div className="font-semibold text-slate-900">
                                {product.name}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                <span className="font-mono">{product.sku}</span>
                                <span aria-hidden="true">·</span>
                                <span>{product.category}</span>
                                <span aria-hidden="true">·</span>
                                <span>{product.unit}</span>
                              </div>
                            </td>

                            {/* Price in COP */}
                            <td className="py-3.5 px-3 text-right align-middle font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                              {formatCOP(product.priceCOP)}
                            </td>

                            {/* Stock & Red Alert if < 3 */}
                            <td className="py-3.5 px-3 text-center align-middle">
                              <div className="inline-flex flex-col items-center">
                                <div
                                  className={`inline-flex items-center gap-1.5 font-mono tabular-nums text-base font-bold ${
                                    isLowStock ? 'text-red-600' : 'text-slate-900'
                                  }`}
                                >
                                  {isLowStock && (
                                    <AlertTriangle
                                      className="w-4 h-4 text-red-600 shrink-0"
                                      aria-label="Alerta de stock bajo"
                                    />
                                  )}
                                  <span>{product.stock} und</span>
                                </div>
                                {isLowStock ? (
                                  <span className="text-[11px] font-semibold text-red-600 whitespace-nowrap">
                                    {isOutOfStock
                                      ? 'Agotado · Reabastecer'
                                      : 'Alerta: Menos de 3 und'}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-slate-500">
                                    Disponible
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Quick +1 / -1 Stock Controls */}
                            <td className="py-3.5 px-3 align-middle">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(product.id, -1)}
                                  disabled={product.stock <= 0}
                                  aria-label={`Restar 1 unidad a ${product.name}`}
                                  className="inline-flex items-center justify-center min-w-[40px] h-9 px-2.5 text-xs font-mono font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                                >
                                  -1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAdjustStock(product.id, 1)}
                                  aria-label={`Sumar 1 unidad a ${product.name}`}
                                  className="inline-flex items-center justify-center min-w-[40px] h-9 px-2.5 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  +1
                                </button>
                              </div>
                            </td>

                            {/* Direct 1-click Add to POS Cart */}
                            <td className="py-3.5 pl-3 pr-6 text-right align-middle">
                              <button
                                type="button"
                                onClick={() => handleAddToCart(product)}
                                disabled={product.stock <= 0}
                                className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                  product.stock <= 0
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : inCartItem
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>
                                  {inCartItem
                                    ? `En carrito (${inCartItem.quantity})`
                                    : 'Vender'}
                                </span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List (< 640px) with 44px touch targets */}
              <div className="sm:hidden divide-y divide-slate-200">
                {filteredInventory.map((product) => {
                  const isLowStock = product.stock < 3;
                  const inCartItem = syncedCart.find(
                    (c) => c.product.id === product.id
                  );

                  return (
                    <div
                      key={product.id}
                      className={`p-4 space-y-3 ${
                        isLowStock ? 'bg-red-50/70' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-base">
                            {product.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <span className="font-mono">{product.sku}</span> ·{' '}
                            {product.category} · {product.unit}
                          </p>
                        </div>
                        <span className="font-mono tabular-nums font-bold text-base text-slate-900 shrink-0">
                          {formatCOP(product.priceCOP)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div>
                          <div
                            className={`flex items-center gap-1.5 font-mono tabular-nums text-sm font-bold ${
                              isLowStock ? 'text-red-600' : 'text-slate-900'
                            }`}
                          >
                            {isLowStock && (
                              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            )}
                            <span>Stock: {product.stock} und</span>
                          </div>
                          {isLowStock && (
                            <p className="text-xs font-semibold text-red-600">
                              Alerta: Stock menor a 3 unidades
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(product.id, -1)}
                            disabled={product.stock <= 0}
                            className="min-w-[44px] min-h-[44px] px-3 text-sm font-mono font-bold text-slate-700 bg-white border border-slate-300 rounded-lg active:bg-slate-100 disabled:opacity-40"
                          >
                            -1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(product.id, 1)}
                            className="min-w-[44px] min-h-[44px] px-3 text-sm font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg active:bg-slate-100"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock <= 0}
                            className={`min-h-[44px] px-3.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 ${
                              product.stock <= 0
                                ? 'bg-slate-100 text-slate-400'
                                : inCartItem
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 text-white'
                            }`}
                          >
                            {inCartItem ? `+1 (${inCartItem.quantity})` : '+ Carrito'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* MODULE 2 & 3: REGISTRO DE VENTA RÁPIDA + MÓDULO DE PEDIDO WHATSAPP */}
          {(activeView === 'all' || activeView === 'pos') && (
            <div
              className={`${
                activeView === 'all' ? 'xl:col-span-5' : 'w-full max-w-4xl mx-auto'
              } space-y-6`}
            >
              {/* Module 2: Quick Sale POS Box */}
              <section
                aria-labelledby="pos-heading"
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="p-4 sm:p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2
                        id="pos-heading"
                        className="text-lg font-bold text-slate-900"
                      >
                        2. Registro de Venta Rápida
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Busca y haz clic en cualquier producto para añadirlo al carrito al instante.
                      </p>
                    </div>
                    {syncedCart.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearCart}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Vaciar carrito</span>
                      </button>
                    )}
                  </div>

                  {/* 1-Click Product Searcher */}
                  <div className="mt-4">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={posSearch}
                        onChange={(e) => setPosSearch(e.target.value)}
                        placeholder="Buscador rápido: escribe nombre o haz clic abajo para agregar..."
                        className="w-full pl-10 pr-8 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900 transition-colors"
                      />
                      {posSearch && (
                        <button
                          type="button"
                          onClick={() => setPosSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                          aria-label="Limpiar buscador de venta"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Quick 1-Click Product Grid */}
                    <div className="mt-3 max-h-52 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/50">
                      {posQuickProducts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No hay productos que coincidan con "{posSearch}".
                        </div>
                      ) : (
                        posQuickProducts.map((product) => {
                          const isLow = product.stock < 3;
                          const isOut = product.stock <= 0;
                          const cartItem = syncedCart.find(
                            (c) => c.product.id === product.id
                          );

                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              disabled={isOut}
                              className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                                isOut
                                  ? 'opacity-50 bg-slate-100 cursor-not-allowed'
                                  : 'hover:bg-emerald-50/70 active:bg-emerald-100/60 bg-white'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                    {product.name}
                                  </span>
                                  {cartItem && (
                                    <span className="text-xs font-mono font-bold text-emerald-700 shrink-0">
                                      · {cartItem.quantity} en carrito
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                  <span className="font-mono">{product.sku}</span>
                                  <span>·</span>
                                  <span
                                    className={
                                      isLow
                                        ? 'text-red-600 font-semibold'
                                        : 'text-slate-500'
                                    }
                                  >
                                    Stock: {product.stock} und
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="font-mono tabular-nums text-xs sm:text-sm font-bold text-slate-900">
                                  {formatCOP(product.priceCOP)}
                                </span>
                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-slate-900 text-white text-xs font-bold">
                                  +1
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Active Shopping Cart Items */}
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-500">
                      Carrito de Venta Actual ({cartTotalItems}{' '}
                      {cartTotalItems === 1 ? 'artículo' : 'artículos'})
                    </h3>
                  </div>

                  {syncedCart.length === 0 ? (
                    <div className="py-8 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <ShoppingCart className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700">
                        El carrito está vacío
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Haz clic en cualquier producto del buscador superior o de la tabla de inventario para agregarlo.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                      {syncedCart.map((item) => {
                        const subtotal = item.product.priceCOP * item.quantity;
                        return (
                          <div
                            key={item.product.id}
                            className="p-3 sm:px-4 flex items-center justify-between gap-3 bg-white"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {item.product.name}
                              </p>
                              <p className="text-xs text-slate-500 font-mono tabular-nums">
                                {formatCOP(item.product.priceCOP)} c/u · Stock disp:{' '}
                                {item.product.stock}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateCartQuantity(item.product.id, -1)
                                  }
                                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                                  aria-label="Disminuir cantidad"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-8 text-center font-mono tabular-nums text-xs font-bold text-slate-900">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateCartQuantity(item.product.id, 1)
                                  }
                                  className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                                  aria-label="Aumentar cantidad"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="w-24 text-right font-mono tabular-nums text-sm font-bold text-slate-900">
                                {formatCOP(subtotal)}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveFromCart(item.product.id)
                                }
                                className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer"
                                aria-label="Eliminar del carrito"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Payment Method & Optional Change Calculator */}
                  <div className="pt-2 space-y-3">
                    <div>
                      <span className="block text-xs font-medium text-slate-600 mb-1.5">
                        Medio de Pago
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-lg">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={`py-2 px-2.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              paymentMethod === method
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>
                    </div>

                    {paymentMethod === 'Efectivo' && syncedCart.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div>
                          <label
                            htmlFor="cash-input"
                            className="block text-[11px] font-medium text-slate-500"
                          >
                            Efectivo recibido (Opcional)
                          </label>
                          <input
                            id="cash-input"
                            type="text"
                            inputMode="numeric"
                            value={cashTendered}
                            onChange={(e) => setCashTendered(e.target.value)}
                            placeholder="Ej: 50000"
                            className="mt-1 w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-md focus:outline-none focus:border-slate-900"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <span className="text-[11px] font-medium text-slate-500">
                            Cambio / Devuelta a entregar
                          </span>
                          <span className="text-base font-bold font-mono tabular-nums text-emerald-700 mt-1">
                            {parsedCashTendered >= cartTotalCOP && cartTotalCOP > 0
                              ? formatCOP(cashChangeCOP)
                              : '$ 0'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Total & Confirmar Venta CTA */}
                  <div className="pt-3 border-t border-slate-200 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-slate-600">
                        Total a Cobrar (COP)
                      </span>
                      <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
                        {formatCOP(cartTotalCOP)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmSale}
                      disabled={syncedCart.length === 0}
                      className="w-full py-3.5 px-5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Confirmar Venta y Descontar Stock</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* MODULE 3: MÓDULO DE PEDIDO WHATSAPP */}
              <section
                aria-labelledby="whatsapp-heading"
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="p-4 sm:p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h2
                        id="whatsapp-heading"
                        className="text-lg font-bold text-slate-900"
                      >
                        3. Módulo de Pedido WhatsApp
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Genera el resumen del pedido actual y abre el enlace directo en WhatsApp para el cliente.
                      </p>
                    </div>
                    <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4">
                  {/* Customer & Delivery Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="wa-customer-name"
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        Nombre del Cliente (Opcional)
                      </label>
                      <input
                        id="wa-customer-name"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Ej:Vecina Marta / Juan Pérez"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="wa-customer-phone"
                        className="block text-xs font-medium text-slate-600 mb-1"
                      >
                        Celular WhatsApp (Opcional)
                      </label>
                      <input
                        id="wa-customer-phone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Ej: 3104567890 o vacío"
                        className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <span className="block text-xs font-medium text-slate-600 mb-1">
                        Modalidad
                      </span>
                      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setDeliveryType('Domicilio')}
                          className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            deliveryType === 'Domicilio'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600'
                          }`}
                        >
                          Domicilio
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeliveryType('Mostrador')}
                          className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                            deliveryType === 'Mostrador'
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600'
                          }`}
                        >
                          Tienda
                        </button>
                      </div>
                    </div>

                    {deliveryType === 'Domicilio' && (
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="wa-address"
                          className="block text-xs font-medium text-slate-600 mb-1"
                        >
                          Dirección o Nota de Entrega
                        </label>
                        <input
                          id="wa-address"
                          type="text"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Ej: Calle 45 #12-30 Torre 2 Apto 402"
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                        />
                      </div>
                    )}
                  </div>

                  {/* Live Message Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-500">
                        Vista previa del mensaje generado
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyWhatsApp}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
                      >
                        {copiedWhatsApp ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar texto</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3.5 text-xs font-mono leading-relaxed text-slate-800 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap overflow-x-auto">
                      {whatsappPreviewText}
                    </pre>
                  </div>

                  {/* Direct Link Button to https://wa.me/?text=... */}
                  <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <a
                      href={whatsappDirectHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2 text-center whitespace-nowrap"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Abrir Pedido en WhatsApp (wa.me)</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0" />
                    </a>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* HISTORIAL DE VENTAS EN MEMORIA LOCAL */}
        {(activeView === 'all' || activeView === 'history') && (
          <section
            aria-labelledby="sales-history-heading"
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2
                  id="sales-history-heading"
                  className="text-lg font-bold text-slate-900"
                >
                  Registro de Ventas Confirmadas en Sesión
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cada venta confirmada descuenta existencias del inventario y permite reenviar el resumen por WhatsApp.
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                Total acumulado hoy: {formatCOP(todaySalesTotalCOP)}
              </span>
            </div>

            {sales.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <Receipt className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  Aún no hay ventas confirmadas en esta sesión.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {sales.map((sale) => {
                  const saleWaText = [
                    `*Kovex — Comprobante ${sale.folio}*`,
                    `Fecha: ${sale.timestamp}`,
                    sale.customerName
                      ? `Cliente: ${sale.customerName}`
                      : `Cliente: Mostrador`,
                    `Entrega: ${sale.deliveryType}${
                      sale.deliveryAddress ? ` (${sale.deliveryAddress})` : ''
                    }`,
                    '',
                    '*Productos:*',
                    ...sale.items.map(
                      (i) =>
                        `- ${i.quantity}x ${i.name} (${formatCOP(i.subtotalCOP)})`
                    ),
                    '',
                    `Medio de pago: ${sale.paymentMethod}`,
                    `*TOTAL PAGADO: ${formatCOP(sale.totalCOP)} COP*`,
                  ].join('\n');

                  const saleWaHref = `https://wa.me/?text=${encodeURIComponent(
                    saleWaText
                  )}`;

                  return (
                    <div
                      key={sale.id}
                      className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-bold text-slate-900">
                            {sale.folio}
                          </span>
                          <span>·</span>
                          <span>{sale.timestamp}</span>
                          <span>·</span>
                          <span className="font-medium text-slate-700">
                            Pago: {sale.paymentMethod}
                          </span>
                          <span>·</span>
                          <span>{sale.deliveryType}</span>
                          {sale.customerName && (
                            <>
                              <span>·</span>
                              <span className="text-slate-700">
                                Cliente: {sale.customerName}
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-slate-800">
                          {sale.items
                            .map((item) => `${item.quantity}x ${item.name}`)
                            .join(' · ')}
                        </p>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                        <span className="font-mono tabular-nums text-base font-bold text-slate-900">
                          {formatCOP(sale.totalCOP)}
                        </span>
                        <a
                          href={saleWaHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Enviar por WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Kovex — Sistema de Gestión Rápida para Pequeños Comercios</span>
        <span>Prototipo MVP interactivo en memoria local · Precios en COP</span>
      </footer>

      {/* Modal: + Nuevo Producto */}
      {isNewProductOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-new-product-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full overflow-hidden shadow-lg">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-slate-900" />
                <h2
                  id="modal-new-product-title"
                  className="text-base font-bold text-slate-900"
                >
                  Agregar Producto al Inventario
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProductOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label
                  htmlFor="np-name"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Nombre del Producto *
                </label>
                <input
                  id="np-name"
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ej: Azúcar Morena 1kg"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="np-category"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Categoría
                  </label>
                  <select
                    id="np-category"
                    value={newProdCategory}
                    onChange={(e) =>
                      setNewProdCategory(e.target.value as ProductCategory)
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="np-unit"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Presentación / Unidad
                  </label>
                  <input
                    id="np-unit"
                    type="text"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    placeholder="Ej: Bolsa 1kg"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="np-price"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Precio en COP *
                  </label>
                  <input
                    id="np-price"
                    type="text"
                    inputMode="numeric"
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="Ej: 4800"
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="np-stock"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Stock Inicial
                  </label>
                  <input
                    id="np-stock"
                    type="number"
                    min={0}
                    required
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProductOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
