import { PRODUCT_STATUS } from "../constants/productStatus.js";

export const INITIAL_PRODUCT_FORM = {
    name: "",
    description: "",
    price: 0,
    stock: 0,
    maxPurchaseQuantity: null,
    type: PRODUCT_STATUS.NORMAL,
    status: "DRAFT",
    saleStartAt: "",
    saleEndAt: ""
};
