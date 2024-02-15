const { default: mongoose } = require("mongoose");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

// Loading the cart page
const loadCart = async (req, res, next) => {
  try {
    const userId = res.locals.user;
    const cartData = await Cart.findOne({ user_id: userId._id });

    let cartDataWithProductDetails = await Cart.aggregate([
      {
        $match: {
          user_id: new mongoose.Types.ObjectId(userId),
        }, // Match the specific cart document
      },
      {
        $unwind: "$items", // Deconstruct the items array
      },
      {
        $lookup: {
          from: Product.collection.name,
          localField: "items.product_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      }
    ]);
    // console.log(cartDataWithProductDetails)

    // let productdata = cartDataWithProductDetails.filter((item) => {
    //   return item.productDetails.isDeleted === false
    // })

    let total = 0;
    for (let i = 0; i < cartDataWithProductDetails.length; i++) {
      total +=
        cartDataWithProductDetails[i].items.price *
        cartDataWithProductDetails[i].items.quantity;
    }

    // console.log(cartDataWithProductDetails)
    res.render("shop-cart", {
      // cart: productdata,   
      cart: cartDataWithProductDetails,   
      totalPrice: total,
    });
  } catch (error) {
    console.log("Failed to load the cart page: ", error);
    next(error)
  }
};

// Add a product to the cart
const addToCart = async (req, res, next) => {
  try {
      const userId = res.locals.user;
      const productId = req.params.id;

      const productData = await Product.findById(productId).populate('offer');

      if (!productData) {
          return res.status(404).json({ message: "Product not found" });
      }

      const userCart = await Cart.findOne({ user_id: userId });

      const discountedPrice = Math.floor(
        productData.offer
          ? productData.price * (1 - productData.offer.percentage / 100)
          : productData.price
      );
      
     
      if (!userCart) {
          const newCart = new Cart({
              user_id: userId,
              items: [
                  {
                      product_id: productData._id,
                      quantity: 1,
                      price: discountedPrice,
                      totalPrice: discountedPrice,
                  },
              ],
              totalProductsPrice: discountedPrice,
          });
          await newCart.save();
      } else {
          const existingItem = userCart.items.find(item => item.product_id.equals(productData._id));

          if (existingItem) {
              existingItem.quantity += 1;
              existingItem.price = discountedPrice;
              existingItem.totalPrice = existingItem.quantity * existingItem.price;
          } else {
              userCart.items.push({
                  product_id: productData._id,
                  quantity: 1,
                  price: discountedPrice,
                  totalPrice: discountedPrice
              });
          }

          

          userCart.totalProductsPrice = userCart.items.reduce((total, item) => total + item.totalPrice, 0);
          await userCart.save();
      }

      // res.status(200).json({ message: "Product added to cart successfully" });
      res.redirect("/cart");
  } catch (error) {
      console.error("Failed to add the product in the cart:", error);
      next(error);
  }
};



//  Remove a product from the cart
const removeItem = async (req, res, next) => {
  try {
    const userId = res.locals.user;
    const productIdToRemove = req.params.id;

    // Find the user's cart
    const userCart = await Cart.findOne({ user_id: userId });

    if (!userCart) {
      return res.status(404).json({ message: "User's cart not found" });
    }

    // Find the item with the specified product_id in the user's cart
    const itemToRemoveIndex = userCart.items.findIndex((item) =>
      item.product_id.equals(productIdToRemove)
    );

    if (itemToRemoveIndex !== -1) {
      // Remove the item from the cart's items array
      const removedItem = userCart.items.splice(itemToRemoveIndex, 1)[0];

      // Update the cart's totalProductsPrice
      userCart.totalProductsPrice -= removedItem.totalPrice;

      // Save the updated cart
      await userCart.save();

      return res.redirect("/cart");
    } else {
      return res.status(404).json({ message: "Product not found in the cart" });
    }
  } catch (error) {
    console.log("Failed to remove product in the cart: ", error);
    next(error)
    // res.status(500).json({ message: "Internal server error" });
  }
};


const updateQuantity = async (req, res, next) => {
  try {
      const productId = req.params.id;
      const user = res.locals.user;
      const newQty = req.body.quantity;

      const cart = await Cart.findOne({ user_id: user._id });
      const productIndex = cart.items.findIndex(
          (item) => item.product_id == productId
      );

      if (productIndex !== -1) {
          // const productData = await Product.findById({ _id: productId });
          const productData = await Product.findById(productId).populate('offer');
          if (!productData) {
              return res.status(404).json({ message: "Product not found" });
          }

          // // Determine the smaller of CategoryOfferPrice and productOfferPrice (when productOfferPrice is not 0)
          // const smallerPrice = (productData.productOfferPrice !== 0)
          //     ? Math.min(productData.CategoryOfferPrice, productData.productOfferPrice)
          //     : (productData.CategoryOfferPrice !== 0)
          //         ? productData.CategoryOfferPrice
          //         : productData.price;

          const discountedPrice = Math.floor(
            productData.offer
              ? productData.price * (1 - productData.offer.percentage / 100)
              : productData.price
          );
          

          cart.items[productIndex].quantity = newQty;
          cart.items[productIndex].price = discountedPrice;
          cart.items[productIndex].totalPrice = newQty * discountedPrice;

          // Update the cart's totalProductsPrice
          cart.totalProductsPrice = cart.items.reduce((total, item) => total + item.totalPrice, 0);

          await cart.save();
          res.redirect("/cart");
      }
  } catch (error) {
      console.error("Failed to update quantity in the cart: ", error);
      next(error);
  }
};



// Finding the total items in the cart for displaying as the badge
async function fetchCartItemCount(req, res, next) {
  try {
    const userId = res.locals.user ? res.locals.user._id : null;

    if (userId) {
      const cart = await Cart.find({ user_id: userId });

      if (cart && cart.length > 0) {
        const items = cart[0].items.length > 0 ? cart[0].items.length : null;
        res.locals.cartItemCount = items;
      } else {
        res.locals.cartItemCount = null;
      }
    } else {
      res.locals.cartItemCount = null;
    }

    next();
  } catch (error) {
    console.error('Error fetching cart item count:', error);
    res.locals.cartItemCount = null; // Set to 0 if an error occurs
    next();
  }
}

   
  
module.exports = {
  addToCart,
  loadCart,
  removeItem,
  updateQuantity,
  fetchCartItemCount
};
