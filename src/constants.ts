export interface FlashItem {
  id: string;
  name: string;
  style: 'American' | 'Japanese';
  url: string;
}

export const FLASH_COLLECTION: FlashItem[] = [
  // American Traditional (Graphic Illustrations)
  {
    id: 'am-heart',
    name: 'Heart & Arrow',
    style: 'American',
    url: 'https://img.freepik.com/free-vector/heart-with-arrow-tattoo-style_23-2147503381.jpg',
  },
  {
    id: 'am-rose',
    name: 'Classic Rose',
    style: 'American',
    url: 'https://img.freepik.com/free-vector/hand-drawn-traditional-rose-tattoo_23-2148834038.jpg',
  },
  {
    id: 'am-panther',
    name: 'Crawling Panther',
    style: 'American',
    url: 'https://img.freepik.com/free-vector/black-panther-tattoo-illustration_23-2148834039.jpg',
  },
  {
    id: 'am-swallow',
    name: 'Traditional Swallow',
    style: 'American',
    url: 'https://img.freepik.com/free-vector/traditional-swallow-tattoo-illustration_23-2148834040.jpg',
  },
  {
    id: 'am-skull',
    name: 'Skull & Dagger',
    style: 'American',
    url: 'https://img.freepik.com/free-vector/skull-with-dagger-tattoo-illustration_23-2148834041.jpg',
  },
  // Japanese Traditional (Graphic Illustrations)
  {
    id: 'jp-dragon',
    name: 'Ryu Dragon',
    style: 'Japanese',
    url: 'https://img.freepik.com/free-vector/japanese-dragon-tattoo-illustration_23-2148834042.jpg',
  },
  {
    id: 'jp-koi',
    name: 'Nishikigoi',
    style: 'Japanese',
    url: 'https://img.freepik.com/free-vector/japanese-koi-fish-tattoo-illustration_23-2148834043.jpg',
  },
  {
    id: 'jp-hannya',
    name: 'Hannya Mask',
    style: 'Japanese',
    url: 'https://img.freepik.com/free-vector/japanese-hannya-mask-tattoo-illustration_23-2148834044.jpg',
  }
];
