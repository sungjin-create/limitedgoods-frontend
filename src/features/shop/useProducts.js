import { useEffect, useRef, useState } from 'react';
import { getProducts } from '../../api/index.js';

const PRODUCT_PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 300;

export function useProducts({ setNotice, onListChange }) {
  const [products, setProducts] = useState([]);
  const [productPage, setProductPage] = useState(0);
  const [totalProductPages, setTotalProductPages] = useState(1);
  const [isFirstProductPage, setIsFirstProductPage] = useState(true);
  const [isLastProductPage, setIsLastProductPage] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const didMountSearch = useRef(false);
  const onListChangeRef = useRef(onListChange);
  const latestRequestRef = useRef(0);

  onListChangeRef.current = onListChange;

  const selectedProduct = products.find((product) => product.id === selectedProductId)
    ?? products[0]
    ?? null;

  async function loadProducts(page = 0, keyword = searchQuery) {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;

    try {
      const data = await getProducts({ page, size: PRODUCT_PAGE_SIZE, keyword });
      const nextProducts = Array.isArray(data) ? data : (data.content ?? []);
      if (latestRequestRef.current !== requestId) return;

      setProducts(nextProducts);
      setProductPage(data.number ?? page);
      setTotalProductPages(Array.isArray(data) ? 1 : (data.totalPages || 1));
      setIsFirstProductPage(Array.isArray(data) ? true : Boolean(data.first));
      setIsLastProductPage(Array.isArray(data) ? true : Boolean(data.last));
      setNotice({ type: 'success', message: '상품 목록을 최신 상태로 불러왔습니다.' });
    } catch (error) {
      if (latestRequestRef.current !== requestId) return;
      setProducts([]);
      setProductPage(0);
      setTotalProductPages(1);
      setIsFirstProductPage(true);
      setIsLastProductPage(true);
      setNotice({ type: 'error', message: `상품 목록을 불러오지 못했습니다. ${error.message}` });
    }
  }

  function handleProductPageChange(nextPage) {
    if (nextPage < 0 || nextPage >= totalProductPages || nextPage === productPage) {
      return;
    }

    onListChangeRef.current?.();
    loadProducts(nextPage);
  }

  function handleSearchChange(nextQuery) {
    setSearchQuery(nextQuery);
    onListChangeRef.current?.();
  }

  useEffect(() => {
    const hasSelectedProduct = products.some((product) => product.id === selectedProductId);

    if (products.length > 0 && !hasSelectedProduct) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  useEffect(() => {
    if (!didMountSearch.current) {
      didMountSearch.current = true;
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onListChangeRef.current?.();
      loadProducts(0, searchQuery);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  return {
    products,
    setProducts,
    selectedProduct,
    selectedProductId,
    setSelectedProductId,
    quantity,
    setQuantity,
    searchQuery,
    productPage,
    totalProductPages,
    isFirstProductPage,
    isLastProductPage,
    loadProducts,
    handleProductPageChange,
    handleSearchChange
  };
}
