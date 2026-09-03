export interface GraphicEntry {
  slug: string;
  category: string;
  originalFilename: string;
  width: number;
  height: number;
  orientation: "landscape" | "portrait" | "square";
  thumbPath: string;
  previewPath: string;
  fullPath: string;
  title: string;
  style: string;
  dominantColor: string;
  license: string;
}
