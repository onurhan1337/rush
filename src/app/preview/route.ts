import { NextResponse } from 'next/server';

const HTML = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Rush önizleme</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #FAFAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .shell { max-width: 720px; margin: 0 auto; padding: 40px 24px; display: flex; flex-direction: column; gap: 16px; }
  .bar { background: #E7E7E7; border-radius: 6px; }
  .h10 { height: 40px; width: 160px; }
  .hero { height: 220px; border-radius: 12px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .tile { height: 128px; border-radius: 10px; }
  .line { height: 14px; }
  .w66 { width: 66%; } .w50 { width: 50%; }
</style>
<script>
(function () {
  var cart = { totalFinalPrice: 0, totalPrice: 0, items: [] };
  var subscribers = [];

  window.IkasEvents = {
    subscribe: function (options) { subscribers.push(options); },
  };

  function broadcast(type) {
    for (var i = 0; i < subscribers.length; i++) {
      try { subscribers[i].callback({ type: type, data: { cart: cart } }); } catch (e) {}
    }
  }

  window.addToCart = function (options) {
    cart.items.push({
      id: 'preview-' + options.variantId,
      quantity: options.quantity,
      price: 0,
      variant: { id: options.variantId },
    });
    broadcast('ADD_TO_CART');
    parent.postMessage({ type: 'rush:preview-add-to-cart', variantId: options.variantId, quantity: options.quantity }, '*');
    return Promise.resolve({ success: true });
  };
})();
</script>
</head>
<body>
  <div class="shell">
    <div class="bar h10"></div>
    <div class="bar hero"></div>
    <div class="grid">
      <div class="bar tile"></div>
      <div class="bar tile"></div>
      <div class="bar tile"></div>
    </div>
    <div class="bar line w66"></div>
    <div class="bar line w50"></div>
  </div>
  <script src="/rush.js" data-rush-preview="1"></script>
</body>
</html>`;

export async function GET() {
  return new NextResponse(HTML, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
