export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPrice?: number;
  discount?: number;
  discountPercentage?: number;
  rating?: number;
  ratingCount?: number;
  reviewsCount?: number;
  image: string;
  images?: string[];
  galleryImages?: string[];
  gallery?: string[];
  categoryId: string;
  category?: string;
  categories?: string[];
  subCategory?: string;
  subCategories?: string[];
  styleTag?: string;
  styleTabs?: string[];
  trendTag?: string;
  trends?: string[];
  trendBadge?: string;
  storeBadgeTag?: string;
  badge?: string;
  badgeText?: string;
  isNewBadge?: boolean;
  isNewBadgeEnabled?: boolean;
  newBadgeText?: string;
  inStock?: boolean;
  stockCount?: number;
  stockUrgency?: string;
  isFlashDeal?: boolean;
  isFlashSale?: boolean;
  flashDealDiscount?: number;
  flashDealEndAt?: string;
  colors?: { name: string; colorCode?: string; hex?: string; image?: string }[];
  sizes?: string[];
  description?: string;
  features?: string[];
  brand?: string;
  material?: string;
  fabric?: string;
  ageGroup?: string;
  productType?: string;
  sku?: string;
  soldCount?: number;
  salesText?: string;
  sellersCount?: number;
  isRecommended?: boolean;
  isMostPopular?: boolean;
  isBestSeller?: boolean;
  hasCurveLogo?: boolean;
  cardAspect?: string;
  couponTag?: string;
  couponText?: string;
  priceDropBadge?: { title: string; discountText: string };
}

export interface SubCategory {
  id: string;
  name: string;
  image: string;
  categoryId: string;
  badge?: string;
}

export interface StyleTab {
  id: string;
  name: string;
  image: string;
  categoryId: string;
}

export interface SideCategory {
  id: string;
  name: string;
  iconName?: string;
}

export interface Category {
  id: string;
  name: string;
  iconName?: string;
  itemCount?: number;
  image?: string;
  badge?: string;
  subCategories?: SubCategory[];
  styleTabs?: StyleTab[];
  sideCategories?: SideCategory[];
  banners?: Banner[];
}

export interface Banner {
  id: string;
  categoryId?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  code?: string;
  image: string;
  discount?: string;
}

export interface TrendCampaign {
  id: string;
  hashtag: string;
  title: string;
  badge?: string;
  daysLeft?: string;
  bgImage: string;
  productIds: string[];
  isActive: boolean;
  order: number;
}

export interface TrendHashtag {
  id: string;
  tag: string;
  count?: number;
  isActive?: boolean;
  order?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  price: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
  color?: string;
  size?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  governorate: string;
  address: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  currency: 'YER' | 'SAR';
  status: 'preparing' | 'in_shipping' | 'delivered' | 'cancelled';
  paymentMethod: 'cash_on_delivery' | 'kuraimi' | 'jawali' | 'one_cash';
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  isPaid?: boolean;
}

export interface User {
  uid: string;
  phone: string;
  firstName?: string;
  secondName?: string;
  thirdName?: string;
  lastName?: string;
  governorate?: string;
  role?: 'admin' | 'customer';
  isAdmin?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface PricingSettings {
  sarToYerRateSouth: number;
  usdToYerRateSouth: number;
  sarToYerRateNorth: number;
  usdToYerRateNorth: number;
  freeShippingThreshold: number;
}
