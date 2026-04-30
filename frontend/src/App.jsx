import Router from "./router";
import { CartProvider } from "./context/CartContext";

export default function App() {
  return (
    <CartProvider>
      <Router />
    </CartProvider>
  );
}
