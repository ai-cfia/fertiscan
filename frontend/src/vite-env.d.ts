/// <reference types="vite/client" />

declare module "swiper/css"
declare module "swiper/css/navigation"
declare module "swiper/css/pagination"
declare module "swiper/css/zoom"

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // DEV, PROD, MODE, SSR, BASE_URL are automatically provided by vite/client
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
