Homepage carousel banners
==========================

Drop banner images here, then point each slide at its file in
src/components/home/hero-carousel.tsx by setting the `image` field, e.g.:

  { key: "b1", href: "/buy",      ..., image: "/banners/buy.jpg" }
  { key: "b2", href: "/swap",     ..., image: "/banners/swap.jpg" }
  { key: "b3", href: "/giveaway", ..., image: "/banners/giveaway.jpg" }
  { key: "b4", href: "/wanted",   ..., image: "/banners/wanted.jpg" }

Until `image` is set, a gradient + text placeholder shows instead.

Recommended: ~2304 x 576 px (the banner renders about 1152 px wide at a
4:1-ish ratio; 2x for retina). The whole banner links to its section, so bake
any call-to-action into the artwork itself.
